'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { SpecializationField } from '@/types/desci';

export default function ResearchContributionForm() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [specializations, setSpecializations] = useState<SpecializationField[]>([]);
  const [links, setLinks] = useState<{ type: 'paper' | 'dataset' | 'code' | 'external', url: string, description?: string }[]>([]);
  const [collaborators, setCollaborators] = useState<{ fid: number, name?: string, role: string }[]>([]);
  
  const [linkType, setLinkType] = useState<'paper' | 'dataset' | 'code' | 'external'>('paper');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  
  const [collaboratorFid, setCollaboratorFid] = useState('');
  const [collaboratorName, setCollaboratorName] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/research/contribute');
      return;
    }
    
    // Fetch specializations
    async function fetchSpecializations() {
      try {
        const response = await fetch('/api/research/specializations');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSpecializations(data.specializations);
          }
        }
      } catch (error) {
        console.error('Error fetching specializations:', error);
      }
    }
    
    fetchSpecializations();
  }, [isAuthenticated, router]);
  
  const handleAddTag = () => {
    if (selectedTag && !tags.includes(selectedTag)) {
      setTags([...tags, selectedTag]);
      setSelectedTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleAddLink = () => {
    if (linkUrl) {
      setLinks([...links, {
        type: linkType,
        url: linkUrl,
        description: linkDescription
      }]);
      setLinkType('paper');
      setLinkUrl('');
      setLinkDescription('');
    }
  };
  
  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };
  
  const handleAddCollaborator = () => {
    if (collaboratorFid && collaboratorRole) {
      const fidNum = parseInt(collaboratorFid, 10);
      if (!isNaN(fidNum)) {
        setCollaborators([...collaborators, {
          fid: fidNum,
          name: collaboratorName || undefined,
          role: collaboratorRole
        }]);
        setCollaboratorFid('');
        setCollaboratorName('');
        setCollaboratorRole('');
      }
    }
  };
  
  const handleRemoveCollaborator = (index: number) => {
    setCollaborators(collaborators.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setError('You must be logged in to submit research');
      return;
    }
    
    if (!title || !abstract || !content || tags.length === 0 || links.length === 0) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/research/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          abstract,
          content,
          authorFid: user.fid,
          authorName: user.displayName || user.username,
          tags,
          links,
          collaborators: collaborators.length > 0 ? collaborators : undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to the newly created contribution
        router.push(`/research/contributions/${data.contribution.id}`);
      } else {
        setError(data.error || 'Failed to create contribution');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating contribution:', error);
      setError('An error occurred while creating your contribution');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Submit Research Contribution</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-1">
            Abstract *
          </label>
          <textarea
            id="abstract"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Full Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specialization Fields *
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {tags.map((tag) => (
              <div key={tag} className="bg-purple-100 px-3 py-1 rounded-full flex items-center">
                <span className="text-purple-800 text-sm">{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a specialization</option>
              {specializations.map((spec) => (
                <option key={spec.id} value={spec.name}>
                  {spec.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Links & References *
          </label>
          <div className="space-y-3 mb-3">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs uppercase">
                  {link.type}
                </span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-blue-600 hover:underline truncate">
                  {link.url}
                </a>
                {link.description && (
                  <span className="text-gray-600 text-sm">{link.description}</span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="paper">Academic Paper</option>
              <option value="dataset">Dataset</option>
              <option value="code">Code Repository</option>
              <option value="external">External Link</option>
            </select>
            <input
              type="url"
              placeholder="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddLink}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add Link
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Collaborators (Optional)
          </label>
          <div className="space-y-3 mb-3">
            {collaborators.map((collaborator, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
                <span className="text-gray-800">
                  FID: {collaborator.fid}
                </span>
                {collaborator.name && (
                  <span className="text-gray-800">{collaborator.name}</span>
                )}
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {collaborator.role}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCollaborator(index)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Collaborator FID"
              value={collaboratorFid}
              onChange={(e) => setCollaboratorFid(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={collaboratorName}
              onChange={(e) => setCollaboratorName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Role (e.g., Data Analyst)"
              value={collaboratorRole}
              onChange={(e) => setCollaboratorRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCollaborator}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add Collaborator
          </button>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-3 text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Research Contribution'}
          </button>
        </div>
      </form>
    </div>
  );
} 