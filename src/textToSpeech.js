import { supabase } from './supabase';

export const generateSpeech = async (text, voice = 'nova', instructions) => {
  const { data, error } = await supabase.functions.invoke('text-to-speech', {
    body: { text, voice, instructions },
  });

  if (error) throw new Error(`Failed to generate audio: ${error.message}`);
  if (!data?.audioContent) throw new Error('No audio content received.');
  return data.audioContent;
};

export const createAudioBlob = (base64Audio) => {
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  return new Blob([bytes], { type: 'audio/mpeg' });
};
