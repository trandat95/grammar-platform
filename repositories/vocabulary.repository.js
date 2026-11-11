import { supabase } from "../lib/supabase/client";

export const VocabularyRepository = {
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from("user_vocabularies")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async insertWord(userId, vocabItem) {
    const payload = {
      user_id: userId,
      word: vocabItem.word,
      phonetic: vocabItem.phonetic || "",
      vietnamese: vocabItem.vietnamese || vocabItem.meaning || "",
      part_of_speech: vocabItem.part_of_speech || vocabItem.partOfSpeech || "",
      audio_url: vocabItem.audio_url || vocabItem.audio || "",
      added_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_vocabularies")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWord(userId, wordId) {
    const { error } = await supabase
      .from("user_vocabularies")
      .delete()
      .eq("user_id", userId)
      .eq("id", wordId);
    if (error) throw error;
    return true;
  },
};
