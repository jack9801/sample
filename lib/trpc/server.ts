// lib/trpc/server.ts
// This file defines the tRPC server-side router and procedures.

import { initTRPC, TRPCError } from '@trpc/server';
import { getSession } from '@auth0/nextjs-auth0';
import { createSupabaseAdminClient } from '../supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod'; // Import z from zod

// Define context for tRPC procedures. It will contain user session and Supabase client.
interface Context {
  userId: string | null;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Middleware to check if the user is authenticated
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      userId: ctx.userId, // Ensure userId is passed to subsequent procedures
    },
  });
});

// Create base router and procedures
export const appRouter = t.router({
  // Public procedure for health check
  health: t.procedure.query(() => {
    return { status: 'ok' };
  }),

  // Protected procedures for chat functionality
  chat: t.router({
    // NEW: Get all chat sessions for the authenticated user
    getChatSessions: t.procedure.use(isAuthenticated).query(async ({ ctx }) => {
      const { userId, supabase } = ctx;
      console.log(`[TRPC] Fetching chat sessions for user: ${userId}`);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }); // Order by newest first

      if (error) {
        console.error('Error fetching chat sessions:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch chat sessions.',
        });
      }
      console.log(`[TRPC] Fetched ${data.length} chat sessions for user: ${userId}`);
      return data;
    }),

    // NEW: Create a new chat session for the authenticated user
    createChatSession: t.procedure.use(isAuthenticated)
      .mutation(async ({ ctx }) => {
        const { userId, supabase } = ctx;
        console.log(`[TRPC] Creating new chat session for user: ${userId}`);
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({ user_id: userId })
          .select() // Select the inserted row to get its ID
          .single(); // Expect a single row

        if (error || !data) {
          console.error('Error creating chat session:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create new chat session.',
          });
        }
        console.log(`[TRPC] Created new chat session with ID: ${data.id}`);
        return data; // Return the new session object
      }),

    // NEW: Delete a specific chat session and all its messages (due to CASCADE DELETE)
    deleteChatSession: t.procedure.use(isAuthenticated)
      .input(z.object({ sessionId: z.string().uuid() })) // Expect a UUID string for session ID
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        const { sessionId } = input;
        console.log(`[TRPC] Deleting chat session ${sessionId} for user: ${userId}`);

        // First, verify the user owns this session before deleting
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('user_id')
          .eq('id', sessionId)
          .single();

        if (sessionError || !sessionData || sessionData.user_id !== userId) {
          console.error(`Attempted to delete session ${sessionId} not owned by user ${userId}`);
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not authorized to delete this chat session.',
          });
        }

        const { error } = await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', sessionId); // Delete by session ID

        if (error) {
          console.error(`Error deleting chat session ${sessionId} from Supabase:`, error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete chat session.',
          });
        }
        console.log(`[TRPC] Successfully deleted chat session: ${sessionId}`);
        return { success: true };
      }),

    // NEW: Update the title of a specific chat session
    updateChatSessionTitle: t.procedure.use(isAuthenticated)
      .input(z.object({
        sessionId: z.string().uuid(),
        newTitle: z.string().min(1, "Chat title cannot be empty").max(100, "Chat title is too long")
      }))
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        const { sessionId, newTitle } = input;
        console.log(`[TRPC] Renaming session ${sessionId} to "${newTitle}" for user: ${userId}`);

        // Verify the user owns this session before updating
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('user_id')
          .eq('id', sessionId)
          .single();

        if (sessionError || !sessionData || sessionData.user_id !== userId) {
          console.error(`Attempted to rename session ${sessionId} not owned by user ${userId}`);
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not authorized to rename this chat session.',
          });
        }

        const { data, error } = await supabase
          .from('chat_sessions')
          .update({ title: newTitle })
          .eq('id', sessionId)
          .select()
          .single(); // Select the updated row

        if (error || !data) {
          console.error(`Error updating session title for ${sessionId}:`, error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to rename chat session.',
          });
        }
        console.log(`[TRPC] Session ${sessionId} renamed to "${data.title}".`);
        return data; // Return the updated session object
      }),

    // MODIFIED: Fetch messages for a specific chat session
    getMessages: t.procedure.use(isAuthenticated)
      .input(z.object({ sessionId: z.string().uuid() })) // Now requires a sessionId
      .query(async ({ ctx, input }) => {
        const { userId, supabase } = ctx;
        const { sessionId } = input;
        console.log(`[TRPC] Fetching messages for session: ${sessionId} for user: ${userId}`);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId) // Filter by session_id
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages for session:', sessionId, error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch messages for session.',
          });
        }
        console.log(`[TRPC] Fetched ${data.length} messages for session: ${sessionId}`);
        return data;
      }),

    // MODIFIED: Send a text message with a specific session ID
    sendTextMessage: t.procedure.use(isAuthenticated)
      .input(z.object({
        prompt: z.string(),
        isUser: z.boolean(),
        sessionId: z.string().uuid() // Now requires a sessionId
      }))
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        const { prompt, isUser, sessionId } = input;
        console.log(`[TRPC] User ${userId} sending text message to session ${sessionId}: "${prompt}"`);

        // Save user's message first
        const { error: userMessageError } = await supabase.from('messages').insert({
          user_id: userId,
          session_id: sessionId, // Include session_id
          content: prompt,
          role: 'user',
          type: 'text',
        });
        if (userMessageError) {
          console.error('Error saving user message:', userMessageError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to save user message.',
          });
        }
        console.log('[TRPC] User message saved to Supabase.');

        // Robust API Key check and logging for text model
        const apiKeyText = process.env.GOOGLE_API_KEY_TEXT;
        console.log(`[TRPC] (sendTextMessage) GOOGLE_API_KEY_TEXT value: ${apiKeyText ? 'Key is present (truncated for security): ' + apiKeyText.substring(0, 5) + '...' : 'Key is undefined or empty'}`);
        if (!apiKeyText) {
          console.error('GOOGLE_API_KEY_TEXT is not set for text generation.');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Gemini API key for text is missing.',
          });
        }

        const genAI = new GoogleGenerativeAI(apiKeyText);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        try {
          console.log('[TRPC] Calling Gemini text model...');
          const result = await model.generateContent(prompt);
          const response = result.response;
          const text = response.text();
          console.log(`[TRPC] Gemini text response: "${text}"`);

          // Save AI's response
          const { error: aiMessageError } = await supabase.from('messages').insert({
            user_id: userId,
            session_id: sessionId, // Include session_id
            content: text,
            role: 'model',
            type: 'text',
          });
          if (aiMessageError) {
            console.error('Error saving AI message:', aiMessageError);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to save AI message.',
            });
          }
          console.log('[TRPC] AI message saved to Supabase.');
          return { userMessage: prompt, aiMessage: text };
        } catch (error) {
          console.error('Error generating text with Gemini:', error);
          if (error instanceof Error) {
            console.error('Gemini error message:', error.message);
            console.error('Gemini error name:', error.name);
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to generate AI text response: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }),

    // MODIFIED: Generate an image with a specific session ID
    generateImage: t.procedure.use(isAuthenticated)
      .input(z.object({
        prompt: z.string(),
        sessionId: z.string().uuid() // Now requires a sessionId
      }))
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        const { prompt, sessionId } = input;
        console.log(`[TRPC] User ${userId} requesting image generation for session ${sessionId}, prompt: "${prompt}"`);

        // Save user's image prompt
        const { error: userPromptError } = await supabase.from('messages').insert({
          user_id: userId,
          session_id: sessionId, // Include session_id
          content: prompt,
          role: 'user',
          type: 'image_prompt',
        });
        if (userPromptError) {
          console.error('Error saving user image prompt:', userPromptError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to save image prompt.',
          });
        }
        console.log('[TRPC] User image prompt saved to Supabase.');

        // --- TEMPORARY WORKAROUND FOR BILLING/IMAGEN API ISSUE ---
        const apiKeyText = process.env.GOOGLE_API_KEY_TEXT;
        console.log(`[TRPC] (generateImage workaround) GOOGLE_API_KEY_TEXT value: ${apiKeyText ? 'Key is present (truncated for security): ' + apiKeyText.substring(0, 5) + '...' : 'Key is undefined or empty'}`);
        if (!apiKeyText) {
          console.error('GOOGLE_API_KEY_TEXT is not set for image workaround.');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Gemini API key for text is missing (for image workaround).',
          });
        }
        const genAI = new GoogleGenerativeAI(apiKeyText);
        const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        try {
          console.log('[TRPC] (Workaround) Calling Gemini text model for image prompt...');
          const textResult = await textModel.generateContent(`Generate a descriptive caption for an image of: ${prompt}.`);
          const textResponse = textResult.response.text();
          console.log(`[TRPC] (Workaround) Generated text for image prompt: "${textResponse}"`);

          const placeholderImageUrl = `https://placehold.co/400x200/cccccc/000000?text=Image+for:${encodeURIComponent(prompt.substring(0,20))}...`;

          const { error: imageSaveError } = await supabase.from('messages').insert({
            user_id: userId,
            session_id: sessionId, // Include session_id
            content: placeholderImageUrl,
            role: 'model',
            type: 'image',
          });
          if (imageSaveError) {
            console.error('Error saving generated image (workaround) to Supabase:', imageSaveError);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to save generated image (workaround).',
            });
          }
          console.log('[TRPC] Generated image (workaround) saved to Supabase.');
          return { imageUrl: placeholderImageUrl };
        } catch (error) {
          console.error('Error in generateImage (workaround) mutation:', error);
          if (error instanceof Error) {
            console.error('Workaround error message:', error.message);
            console.error('Workaround error name:', error.name);
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to generate image (workaround): ${error instanceof Error ? error.message : String(error)}`,
          });
        }
        // --- END TEMPORARY WORKAROUND ---
      }),
  }),
});

// Export type router type signature, which can be used by the client
export type AppRouter = typeof appRouter;

// Create tRPC API handler context
export const createContext = async () => {
  // Get Auth0 session
  const session = await getSession();
  const userId = session?.user?.sub || null; // Auth0 user ID

  // Create Supabase client for the current context
  const supabase = createSupabaseAdminClient();
  console.log(`[TRPC Context] User ID: ${userId ? userId : 'Not authenticated'}`);
  return {
    session,
    userId,
    supabase,
  };
};
