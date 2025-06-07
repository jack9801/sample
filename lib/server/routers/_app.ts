// lib/trpc/server/routers/_app.ts
// This file defines your main tRPC application router, including chat-related procedures.

import { z } from 'zod';
import { publicProcedure, router } from '../../trpc/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '../../supabaseClient';

// Initialize Gemini API (ensure GOOGLE_API_KEY is in .env.local)
const genAIText = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY_TEXT!);
const genAIImage = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY_IMAGE!);

// Zod schemas for input/output validation
const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(['user', 'model']),
  type: z.enum(['text', 'image', 'image_prompt']),
  created_at: z.string(),
  user_id: z.string(),
  session_id: z.string(),
});

const chatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  user_id: z.string(),
  created_at: z.string(),
});

export const appRouter = router({
  chat: router({
    // Procedure to get all chat sessions for the current user
    getSessions: publicProcedure
      .query(async ({ ctx }) => {
        const { userId, supabase } = ctx;
        if (!userId) throw new Error("User not authenticated.");
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data;
      }),

    // Procedure to create a new chat session
    createSession: publicProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        if (!userId) throw new Error("Authentication required to create a session.");
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert([
            {
              title: input.title || "New Chat",
              user_id: userId,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      }),

    // Procedure to get messages for a specific session
    getMessages: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        if (!userId) throw new Error("Authentication required to get messages.");

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', input.sessionId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) {
          throw new Error(`Failed to load messages: ${error.message}`);
        }
        return data as z.infer<typeof messageSchema>[];
      }),

    // TEXT GENERATION
    sendTextMessage: publicProcedure
      .input(z.object({ prompt: z.string(), sessionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        if (!userId) throw new Error("User not authenticated.");

        // Save user's message
        const userMessage = {
          id: crypto.randomUUID(),
          content: input.prompt,
          role: 'user',
          type: 'text',
          created_at: new Date().toISOString(),
          user_id: userId,
          session_id: input.sessionId,
        };
        const { error: userError } = await supabase.from('messages').insert(userMessage);
        if (userError) throw new Error(`Failed to save user message: ${userError.message}`);

        // Call Gemini Text API
        let aiResponseContent = '';
        try {
          const payload = {
            contents: [
              {
                parts: [
                  { text: input.prompt }
                ]
              }
            ]
          };
          const apiKey = process.env.GOOGLE_API_KEY_TEXT || process.env.GOOGLE_API_KEY!;
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (
            result.candidates &&
            result.candidates[0]?.content?.parts?.[0]?.text
          ) {
            aiResponseContent = result.candidates[0].content.parts[0].text;
          } else {
            aiResponseContent = "Apologies, I couldn't get a valid text response from Gemini.";
          }
        } catch (geminiError: any) {
          aiResponseContent = "Apologies, I couldn't generate a text response right now.";
        }

        // Save AI's response
        const aiMessage = {
          id: crypto.randomUUID(),
          content: aiResponseContent,
          role: 'model',
          type: 'text',
          created_at: new Date().toISOString(),
          user_id: userId,
          session_id: input.sessionId,
        };
        const { error: aiError } = await supabase.from('messages').insert(aiMessage);
        if (aiError) throw new Error(`Failed to save AI response: ${aiError.message}`);

        return { success: true };
      }),

    // IMAGE GENERATION
    generateImage: publicProcedure
      .input(z.object({ prompt: z.string(), sessionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        if (!userId) throw new Error("User not authenticated.");

        // Save user's image prompt
        const userImagePromptMessage = {
          id: crypto.randomUUID(),
          content: input.prompt,
          role: 'user',
          type: 'image_prompt',
          created_at: new Date().toISOString(),
          user_id: userId,
          session_id: input.sessionId,
        };
        const { error: userPromptError } = await supabase.from('messages').insert(userImagePromptMessage);
        if (userPromptError) throw new Error(`Failed to save user image prompt: ${userPromptError.message}`);

        // Call Gemini Image API (or Imagen if you have access)
        let aiImageResponseContent = '';
        try {
          const payload = { contents: [{ role: "user", parts: [{ text: input.prompt }] }] };
          const apiKey = process.env.GOOGLE_API_KEY_IMAGE || process.env.GOOGLE_API_KEY!;
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-vision:generateContent?key=${apiKey}`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (
            result.candidates &&
            result.candidates[0]?.content?.parts?.[0]?.inlineData?.data
          ) {
            aiImageResponseContent = `data:image/png;base64,${result.candidates[0].content.parts[0].inlineData.data}`;
          } else {
            aiImageResponseContent = 'https://placehold.co/300x200/FF0000/FFFFFF?text=Image+Gen+Failed';
          }
        } catch (imageGenError: any) {
          aiImageResponseContent = 'https://placehold.co/300x200/FF0000/FFFFFF?text=Image+Gen+Failed';
        }

        // Save AI's image response
        const aiImageMessage = {
          id: crypto.randomUUID(),
          content: aiImageResponseContent,
          role: 'model',
          type: 'image',
          created_at: new Date().toISOString(),
          user_id: userId,
          session_id: input.sessionId,
        };
        const { error: aiImageError } = await supabase.from('messages').insert(aiImageMessage);
        if (aiImageError) throw new Error(`Failed to save AI image response: ${aiImageError.message}`);

        return { success: true };
      }),

    // RENAME CHAT SESSION
    renameSession: publicProcedure
      .input(z.object({ sessionId: z.string(), newTitle: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        if (!userId) throw new Error("User not authenticated.");

        const { error } = await supabase
          .from('chat_sessions')
          .update({ title: input.newTitle })
          .eq('id', input.sessionId)
          .eq('user_id', userId);

        if (error) throw new Error(`Failed to rename chat: ${error.message}`);
        return { success: true };
      }),

    // DELETE CHAT SESSION
    deleteSession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { userId, supabase } = ctx;
        if (!userId) throw new Error("User not authenticated.");

        // Delete all messages in the session first
        const { error: msgError } = await supabase
          .from('messages')
          .delete()
          .eq('session_id', input.sessionId)
          .eq('user_id', userId);

        if (msgError) throw new Error(`Failed to delete messages: ${msgError.message}`);

        // Then delete the session itself
        const { error: sessionError } = await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', input.sessionId)
          .eq('user_id', userId);

        if (sessionError) throw new Error(`Failed to delete chat session: ${sessionError.message}`);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Context: Use Auth0 sub as userId (text)
export async function createContext({ req, res }: { req: any; res: any }) {
  const session = await getSession(req, res);
  const userId = session?.user?.sub ?? null;
  return {
    supabase: supabaseAdmin,
    userId,
  };
}
