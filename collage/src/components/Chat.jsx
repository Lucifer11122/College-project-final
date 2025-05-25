import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Menu, Trash2, Clock, BookOpen, ExternalLink, Lightbulb, Loader2 } from 'lucide-react';
import { findRelevantKnowledge } from '../data/collegeKnowledge';
import { findNavigationSuggestions, navigationRoutes } from '../data/navigationRoutes';
import { isAskingForCourseRecommendation, generateCourseRecommendations } from '../utils/courseRecommender';
import ChatCourseRecommendation from './ChatCourseRecommendation';

const AI_MODELS = [
  { 
    id: 'llama3-70b-8192', 
    name: 'Llama 3 70B',
    description: 'Powerful language model by Meta'
  },
  { 
    id: 'llama3-8b-8192', 
    name: 'Llama 3 8B',
    description: 'Lightweight Llama 3 model'
  }
]

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navigationSuggestions, setNavigationSuggestions] = useState([]);
  const [courseRecommendations, setCourseRecommendations] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Function to handle navigation
  const handleNavigation = (path) => {
    // If we're already on the same page, just scroll to top
    if (window.location.pathname === path) {
      window.scrollTo(0, 0);
      return;
    }
    
    // Set navigating state
    setIsNavigating(true);
    
    // Add a small delay to show the loading state
    setTimeout(() => {
      // Navigate to the specified path
      window.location.href = path;
    }, 500);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      const newHistoryEntry = {
        id: Date.now(),
        model: selectedModel.name,
        messages: messages,
        timestamp: new Date().toLocaleString()
      };

      const updatedHistory = [newHistoryEntry, ...chatHistory].slice(0, 10);
      setChatHistory(updatedHistory);
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user'
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    // Clear previous navigation suggestions
    setNavigationSuggestions([]);

    try {
      // Check if API key exists
      if (!import.meta.env.VITE_GROQ_API_KEY) {
        throw new Error('GROQ API key is missing. Please check your .env file.');
      }
      
      // Check if the user is asking for course recommendations
      const isAskingForCourses = isAskingForCourseRecommendation(inputMessage);
      let courseRecommendations = null;
      
      if (isAskingForCourses) {
        // Generate course recommendations based on the user's message
        courseRecommendations = generateCourseRecommendations(inputMessage);
        
        // Store the course recommendations in state
        setCourseRecommendations(courseRecommendations);
        
        // Add navigation suggestion to the course recommender page
        const courseRecommenderNavigation = navigationRoutes.find(route => route.id === 'course-recommender');
        if (courseRecommenderNavigation) {
          setNavigationSuggestions([courseRecommenderNavigation]);
        }
        
        // Display a message that we're analyzing their interests
        setMessages(prevMessages => [...prevMessages, {
          id: Date.now() + 0.3,
          text: `Analyzing your interests to find suitable courses...`,
          sender: 'system',
          isCourseAnalysis: true
        }]);
      } else {
        // Clear any previous course recommendations if the user is not asking for courses
        setCourseRecommendations(null);
      }

      // RAG Implementation: Find relevant knowledge from our database
      const relevantKnowledge = findRelevantKnowledge(inputMessage);
      
      // Navigation Implementation: Find navigation suggestions
      const navSuggestions = findNavigationSuggestions(inputMessage);
      
      // Create a system message with the relevant knowledge
      let systemMessage = { 
        role: 'system', 
        content: 'You are a helpful college admission assistant for Banwarilal Bhalotia College. Be friendly and concise in your responses.'
      };
      
      // If we found relevant knowledge, add it to the system message
      if (relevantKnowledge.length > 0) {
        // Add knowledge to system prompt
        systemMessage.content += ' Use the following information to answer the query:\n\n';
        relevantKnowledge.forEach(item => {
          systemMessage.content += `${item.question}\n${item.answer}\n\n`;
        });
        systemMessage.content += 'If the query is not related to the information provided, just respond based on your general knowledge.';
      }
      
      // If we found navigation suggestions, add them to the system message
      if (navSuggestions.length > 0) {
        systemMessage.content += '\n\nThe user might be looking for specific pages. If appropriate, mention they can navigate to: ';
        navSuggestions.forEach(suggestion => {
          systemMessage.content += `${suggestion.title} (${suggestion.description}), `;
        });
      }
      
      // If we generated course recommendations, add them to the system message
      if (courseRecommendations) {
        systemMessage.content += '\n\nI have generated course recommendations for the user based on their message. ';
        
        if (courseRecommendations.type === 'personalized') {
          systemMessage.content += `I detected interests in: ${courseRecommendations.detectedInterests.careers.join(', ')} (careers); `;
          systemMessage.content += `${courseRecommendations.detectedInterests.interests.join(', ')} (interests); `;
          systemMessage.content += `${courseRecommendations.detectedInterests.skills.join(', ')} (skills). `;
        }
        
        systemMessage.content += `\n\nRecommended courses: ${courseRecommendations.courses.map(c => c.name).join(', ')}. `;
        systemMessage.content += 'Please acknowledge that you are showing course recommendations in your response, but do not list the courses again as they will be displayed in a separate UI component.';
      }

      // Display knowledge retrieval message to user
      if (relevantKnowledge.length > 0) {
        setMessages(prevMessages => [...prevMessages, {
          id: Date.now() + 0.5,
          text: `Found ${relevantKnowledge.length} relevant information sources.`,
          sender: 'system',
          isKnowledge: true
        }]);
      }
      
      // Set navigation suggestions for UI display
      if (navSuggestions.length > 0) {
        setNavigationSuggestions(navSuggestions);
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [
            systemMessage,
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 
                    msg.sender === 'system' ? 'system' : 'assistant',
              content: msg.text
            })),
            { role: 'user', content: inputMessage }
          ]
        })
      });

      // Check if the response is ok
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Validate response data structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from API');
      }
      
      const aiResponse = {
        id: Date.now() + 1,
        text: data.choices[0].message.content,
        sender: 'ai'
      };

      setMessages(prevMessages => [...prevMessages, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [...prevMessages, {
        id: Date.now() + 1,
        text: `Error: ${error.message || 'Sorry, there was an error processing your message.'}`,
        sender: 'ai'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoricalChat = (historicalChat) => {
    setMessages(historicalChat.messages);
    setSelectedModel(AI_MODELS.find(model => model.name === historicalChat.model));
    setIsSidebarOpen(false);
  };

  const clearCurrentChat = () => {
    setMessages([]);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
  };

  return (
    <div className="flex h-screen bg-orange-50">
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-xl transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0
      `}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-orange-600">Chat History</h2>
          <button 
            onClick={clearChatHistory}
            className="text-red-500 hover:bg-red-50 p-2 rounded"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-100px)]">
          {chatHistory.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => loadHistoricalChat(chat)}
              className="p-4 border-b hover:bg-orange-50 cursor-pointer flex items-center"
            >
              <Clock className="mr-2 text-orange-500" />
              <div>
                <p className="font-semibold text-gray-800">{chat.model}</p>
                <p className="text-sm text-gray-500">{chat.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-grow">
        <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-4 md:hidden"
            >
              <Menu />
            </button>
            <Bot className="mr-2" />
            <h2 className="text-lg font-bold">Chat with {selectedModel.name}</h2>
          </div>
          <div className="flex items-center">
            <select 
              value={selectedModel.id}
              onChange={(e) => {
                const model = AI_MODELS.find(m => m.id === e.target.value);
                setSelectedModel(model);
              }}
              className="bg-orange-600 text-white p-1 rounded"
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <button 
              onClick={clearCurrentChat}
              className="ml-2 hover:bg-orange-600 p-2 rounded"
            >
              <Trash2 />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {messages.map((message, index) => (
            <React.Fragment key={message.id}>
              <div 
                className={`flex items-start space-x-2 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'ai' && (
                  <Bot className="w-6 h-6 text-orange-600" />
                )}
                {message.sender === 'system' && message.isKnowledge && (
                  <BookOpen className="w-6 h-6 text-green-600" />
                )}
                {message.sender === 'system' && message.isCourseAnalysis && (
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                )}
                <div 
                  className={`
                    max-w-[70%] p-3 rounded-lg 
                    ${message.sender === 'user' 
                      ? 'bg-orange-500 text-white' 
                      : message.sender === 'system' && message.isKnowledge
                      ? 'bg-green-100 text-gray-800 border border-green-300'
                      : message.sender === 'system' && message.isNavigation
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : message.sender === 'system' && message.isCourseAnalysis
                      ? 'bg-yellow-100 text-gray-800 border border-yellow-300'
                      : 'bg-orange-100 text-gray-800'}
                  `}
                >
                  {message.text}
                </div>
                {message.sender === 'user' && (
                  <User className="w-6 h-6 text-orange-600" />
                )}
              </div>
              
              {/* Show course recommendations after AI response */}
              {message.sender === 'ai' && 
               index === messages.length - 1 && 
               courseRecommendations && (
                <div className="flex flex-col items-start ml-8 mt-2 mb-4">
                  <ChatCourseRecommendation recommendations={courseRecommendations} />
                </div>
              )}
              
              {/* Show navigation suggestions after AI response */}
              {message.sender === 'ai' && 
               index === messages.length - 1 && 
               navigationSuggestions.length > 0 && (
                <div className="flex flex-col items-start ml-8 mt-2 space-y-2">
                  <div className="text-sm text-gray-500 mb-1">Would you like to navigate to:</div>
                  <div className="flex flex-wrap gap-2">
                    {navigationSuggestions.map(suggestion => (
                      <button
                        key={suggestion.id}
                        onClick={() => {
                          // Add a system message about navigation
                          setMessages(prev => [...prev, {
                            id: Date.now(),
                            text: `Navigating to ${suggestion.title}...`,
                            sender: 'system',
                            isNavigation: true
                          }]);
                          
                          // Navigate to the page after a short delay
                          setTimeout(() => {
                            handleNavigation(suggestion.path);
                          }, 1000);
                        }}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg border border-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {suggestion.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          {isLoading && (
            <div className="flex justify-start items-center space-x-2">
              <Bot className="w-6 h-6 text-orange-600" />
              <div className="bg-orange-100 p-3 rounded-lg flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white p-4 border-t border-orange-200 flex items-center">
          <input 
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder={isLoading ? 'Waiting for response...' : 'Type your message...'}
            disabled={isLoading}
            className={`flex-grow p-2 border ${isLoading ? 'border-orange-200 bg-orange-50' : 'border-orange-300'} rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors`}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading}
            className={`bg-orange-500 text-white p-2 rounded-r-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;