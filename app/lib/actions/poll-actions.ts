"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth-actions";

// CREATE POLL
export async function createPoll(formData: FormData) {
  // Ensure user is authenticated and verified
  const user = await requireAuth();
  
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Validate input to prevent injection attacks
  if (question.length > 500) {
    return { error: "Question is too long. Maximum 500 characters allowed." };
  }

  if (options.some(option => option.length > 200)) {
    return { error: "Options are too long. Maximum 200 characters per option allowed." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: question.trim(),
      options: options.map(opt => opt.trim()),
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  // Ensure user is authenticated and verified
  const user = await requireAuth();
  
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Validate ID format to prevent injection
  if (!id || typeof id !== 'string' || id.length > 50) {
    return { poll: null, error: "Invalid poll ID" };
  }
  
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Validate inputs
  if (!pollId || typeof pollId !== 'string' || pollId.length > 50) {
    return { error: "Invalid poll ID" };
  }
  
  if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex > 10) {
    return { error: "Invalid option index" };
  }
  
  // Get user if authenticated (optional for voting)
  const { data: { user } } = await supabase.auth.getUser();

  // Check if poll exists and option is valid
  const { data: poll } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();
    
  if (!poll) {
    return { error: "Poll not found" };
  }
  
  if (optionIndex >= poll.options.length) {
    return { error: "Invalid option selected" };
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  // Ensure user is authenticated and verified
  const user = await requireAuth();
  
  const supabase = await createClient();
  
  // Validate ID format
  if (!id || typeof id !== 'string' || id.length > 50) {
    return { error: "Invalid poll ID" };
  }
  
  // Verify user owns the poll before deletion
  const { data: poll, error: fetchError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();
    
  if (fetchError) {
    return { error: "Poll not found" };
  }
  
  if (poll.user_id !== user.id) {
    return { error: "You can only delete your own polls" };
  }
  
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  // Ensure user is authenticated and verified
  const user = await requireAuth();
  
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Validate input to prevent injection attacks
  if (question.length > 500) {
    return { error: "Question is too long. Maximum 500 characters allowed." };
  }

  if (options.some(option => option.length > 200)) {
    return { error: "Options are too long. Maximum 200 characters per option allowed." };
  }
  
  // Validate ID format
  if (!pollId || typeof pollId !== 'string' || pollId.length > 50) {
    return { error: "Invalid poll ID" };
  }

  // Verify user owns the poll before updating
  const { data: poll, error: fetchError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", pollId)
    .single();
    
  if (fetchError) {
    return { error: "Poll not found" };
  }
  
  if (poll.user_id !== user.id) {
    return { error: "You can only update your own polls" };
  }

  const { error } = await supabase
    .from("polls")
    .update({ 
      question: question.trim(), 
      options: options.map(opt => opt.trim()),
      updated_at: new Date().toISOString()
    })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/polls");
  return { error: null };
}
