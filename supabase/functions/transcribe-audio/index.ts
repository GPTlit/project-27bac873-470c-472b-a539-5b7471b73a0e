import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('Received audio data, length:', audio.length)

    // Try using OpenAI's Whisper-compatible model first
    // The Lovable AI Gateway supports both Gemini and OpenAI models
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert audio transcriber. Listen carefully to this voice recording and transcribe exactly what is being said.

IMPORTANT INSTRUCTIONS:
1. Output ONLY the transcribed speech text
2. No explanations, descriptions, or formatting
3. If the speech is in Arabic, transcribe it in Arabic script
4. If the speech is in English, transcribe it in English  
5. If mixed languages, transcribe each part in its original language
6. If the audio is silent or you cannot detect clear speech, respond with an empty string

Remember: Just the transcription text, nothing else.`
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audio,
                  format: 'webm'
                }
              }
            ]
          }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI error:', response.status, errorText)
      
      // If input_audio format fails, try with inline_data format for Gemini
      console.log('Trying alternative format...')
      const altResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Listen to this audio recording and transcribe exactly what is being said. Output ONLY the transcription - no explanations or formatting. If Arabic speech, use Arabic script. If no clear speech is detected, respond with an empty string.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:audio/webm;base64,${audio}`
                  }
                }
              ]
            }
          ],
        }),
      })

      if (!altResponse.ok) {
        const altErrorText = await altResponse.text()
        console.error('Alternative format also failed:', altErrorText)
        // Return empty transcription instead of failing
        return new Response(
          JSON.stringify({ text: '' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const altResult = await altResponse.json()
      let transcribedText = altResult.choices?.[0]?.message?.content || ''
      transcribedText = cleanTranscription(transcribedText)

      return new Response(
        JSON.stringify({ text: transcribedText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Transcription result:', JSON.stringify(result))
    
    let transcribedText = result.choices?.[0]?.message?.content || ''
    transcribedText = cleanTranscription(transcribedText)

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    // Return empty transcription instead of error to not break the message flow
    return new Response(
      JSON.stringify({ text: '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function cleanTranscription(text: string): string {
  if (!text) return ''
  
  let cleaned = text.trim()
  
  // Remove common non-transcription responses
  const invalidResponses = [
    '[no speech detected]',
    'no speech detected',
    'cannot hear',
    'no audio',
    'empty',
    'silent',
    'i cannot',
    'i\'m unable',
    'sorry',
  ]
  
  const lowerCleaned = cleaned.toLowerCase()
  for (const invalid of invalidResponses) {
    if (lowerCleaned.includes(invalid)) {
      return ''
    }
  }
  
  // Remove quotes if the entire text is wrapped in them
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1)
  }
  
  return cleaned
}
