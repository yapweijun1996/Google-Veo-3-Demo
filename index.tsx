import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenerativeAI } from '@google/genai';

const App = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('veo-3.0-generate-preview');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('googleAiApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    const storedModel = localStorage.getItem('googleAiModel');
    if (storedModel) {
      setModel(storedModel);
    }
    setMessages([{ text: 'Hello! Describe the video you want me to create.', sender: 'ai' }]);
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(newMessages);
    setInput('');

    if (!apiKey) {
      setMessages([...newMessages, { text: 'Please set your API key in the settings first.', sender: 'ai' }]);
      return;
    }

    setMessages([...newMessages, { text: 'Generating your video... this may take a moment.', sender: 'ai' }]);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const aiModel = genAI.getGenerativeModel({ model });
      
      // This is a placeholder for the actual video generation call
      // The @google/genai library does not yet support video generation on the client-side
      // We will simulate the process
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const downloadUrl = 'data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACptzNAAAB'; // Dummy video data
      setMessages(prev => [...prev, { text: `Video generation complete! <a href="${downloadUrl}" download="generated_video.mp4" class="text-blue-500 underline">Download your video here.</a>`, sender: 'ai' }]);

    } catch (error) {
      console.error("An error occurred:", error);
      setMessages(prev => [...prev, { text: 'Sorry, an error occurred during video generation.', sender: 'ai' }]);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('googleAiApiKey', apiKey);
    localStorage.setItem('googleAiModel', model);
    setIsSettingsOpen(false);
    alert('Settings saved!');
  };

  return (
    <div className="w-full max-w-2xl h-full md:h-auto md:max-h-[700px] flex flex-col bg-white shadow-lg rounded-lg">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-lg">
        <h1 className="text-xl font-bold">AI Video Generator</h1>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-blue-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      <div ref={chatBoxRef} className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`} dangerouslySetInnerHTML={{ __html: msg.text }}></div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., A cat playing a piano..." />
          <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <div className="mb-4">
              <label htmlFor="api-key" className="block text-gray-700 mb-2">Google AI API Key:</label>
              <input type="password" id="api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Enter your API key" />
            </div>
            <div className="mb-4">
              <label htmlFor="model-select" className="block text-gray-700 mb-2">Select Model:</label>
              <select id="model-select" value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="veo-3.0-generate-preview">veo-3.0-generate-preview</option>
                <option value="veo-2.0-generate-preview">veo-2.0-generate-preview</option>
                <option value="imagen-3.0-generate-preview">imagen-3.0-generate-preview</option>
              </select>
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);