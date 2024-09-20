'use client'
import React, { useState } from "react";
import { Box, Button, Stack, TextField } from '@mui/material'
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi!"
    }
  ])
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');

  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])

    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''

      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
        return reader.read().then(processText)
      })
    })
  }



  const addProfessor = async () => {
    if (!link) {
      alert('Please insert a link.');
      return;
    }

    alert("Adding Professor, this may take a minute or two")
    setIsLoading(true);
    try {
      const res = await fetch('/api/run-python', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: link }), 
      });
      const data = await res.json();
      if (res.ok) {
        setOutput(data.output);
      } else {
        console.error('Error:', data.error);
        setOutput(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setOutput(`Fetch error: ${error.message}`);
    }
    finally {
      alert("Professor added!")
      setLink("")
      setIsLoading(false);
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      >
      <Stack
        direction="column"
        width="50%"
        height="70%"
        border="1px solid black"
        p={2}
        spacing={3}>
        <Stack direction="column" spacing={2} flexGrow={1} overflow={"auto"} maxHeight={"100%"}>
          {
            messages.map((message, index) => (
              <Box key={index} display="flex" justifyContent={message.role === "assistant" ? 'flex-start' : 'flex-end'}>
                <Box bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'} color="white" borderRadius={16} p={3}><ReactMarkdown>{message.content}</ReactMarkdown></Box>
              </Box>
            ))
          }
        </Stack>
        <Stack direction={"row"} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
            }} />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
        </Stack>
        <Stack
          direction="row"
          width="50%"
          height="12%"
          border="1px solid black"
          p={2}
          spacing={3}>
          <Box
            flexDirection="column"
            width={"80%"}
          >
            <TextField
              label="Insert Rate My Prof link"
              fullWidth
              value={link}
              onChange={(e) => {
                setLink(e.target.value)
              }} />
            <Box>Only supports <a href="https://www.ratemyprofessors.com/">RateMyProfessors.com</a> </Box>
          </Box>
          <Button variant="contained" width="40%" onClick={addProfessor} disabled={isLoading}>{isLoading ? 'Adding Professor...' : 'Add Professor'}</Button>
        </Stack>
    </Box>
  );
}
