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

    // Use Lovable AI Gateway with Gemini for audio transcription
    // Gemini supports audio as inline_data with proper MIME type
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
                text: 'Listen to this audio and transcribe exactly what is being said. Output ONLY the transcribed speech text - no explanations, no descriptions, no formatting. If the speech is in Arabic, transcribe it in Arabic script. If the speech is in English, transcribe it in English. If mixed, transcribe each part in its original language. If you cannot hear any clear speech, respond with exactly: [no speech detected]'
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI error:', response.status, errorText)
      throw new Error(`AI service error: ${errorText}`)
    }

    const result = await response.json()
    console.log('Transcription result:', JSON.stringify(result))
    
    let transcribedText = result.choices?.[0]?.message?.content || ''
    
    // Clean up the response
    transcribedText = transcribedText.trim()
    if (transcribedText === '[no speech detected]' || transcribedText.toLowerCase().includes('no speech') || transcribedText.toLowerCase().includes('cannot hear')) {
      transcribedText = ''
    }

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
