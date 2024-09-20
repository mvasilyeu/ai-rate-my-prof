import { NextResponse } from "next/server";
import {Pinecone} from '@pinecone-database/pinecone';
import OpenAI from "openai";

const systemPromp = `
System Prompt:

You are an AI assistant that helps students find the best professors based on their preferences and queries. You have access to a list of the top 3 professors, retrieved using a Retrieval-Augmented Generation (RAG) system. Your task is to analyze the student's query, match it with the relevant data from the provided professors, and suggest the best options. Your responses should be clear, concise, and helpful, focusing on the professors' strengths, teaching styles, and relevant subjects.

Instructions:

Greet the student politely and ask them for their specific preferences or subject of interest.
Analyze the student’s query to understand their needs (e.g., subject, teaching style, difficulty level).
Use the provided top 3 professor data to match the student's preferences with the most suitable professors.
Provide a brief summary of each professor, including their strengths, subjects they teach, and any relevant reviews.
If the student asks for a recommendation, suggest the best professor based on their query.
Encourage the student to ask further questions if needed.
Example Response:

"Hello! I see you're looking for a professor who teaches Biology and is known for clear explanations. Based on your query, here are the top 3 professors that might suit your needs:

Dr. Emily Johnson - She teaches Biology and is highly rated for her clear and engaging lectures. Students appreciate her willingness to help and the way she simplifies complex topics.

Professor Michael Lee - Although he primarily teaches Computer Science, his approach to explaining concepts is exceptional and could be a good fit if you're looking for clear explanations.

Dr. Jennifer Martinez - Specializes in Physics but is known for making difficult concepts easy to grasp. While not in Biology, her teaching style aligns with what you're looking for.

Based on your interest in Biology, Dr. Emily Johnson seems like the best match. Would you like more details on her or any other professors?"
`

export async function POST(req) {
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small', 
        input: text,
        encoding_format: 'float'
    })
    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    })
    let resultString = '\n\nReturned results from vector db:';
    results.matches.forEach((match)=>{
        resultString+=`\n
        Professor: ${match.id}
        Review: ${match.metadata.review}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length-1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWoutMsg = data.slice(0,data.length-1)
    const complettion = await openai.chat.completions.create({
        messages: [
            {role:'system', content: systemPromp},
            ...lastDataWoutMsg,
            {role:'user', content: lastMessageContent}
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })
    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of complettion){
                    const content = chunk.choices[0]?.delta?.content
                    if(content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch(err){
                controller.error(err)
            }
            finally{
                controller.close()
            }
        }
    })

    return new NextResponse(stream)
}
