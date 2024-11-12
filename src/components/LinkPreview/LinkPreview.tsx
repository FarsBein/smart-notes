import React, { useState, useEffect } from 'react';
import styles from './LinkPreview.module.scss';
import { Card } from './Card';
import { SkeletonLoader } from './SkeletonLoader';

interface LinkPreviewProps {
    link: string;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ link }) => {
    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPreviewData = async () => {
            try {
                const data = await window.electron.ipcRenderer.invoke('get-link-preview', link);
                
                setTitle(data.title);
                setDescription(data.description);
                setSummary(data?.summary || '');
                setImageUrl(data.imageUrl);
                
            } catch (error) {
                console.error('Error fetching link preview:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPreviewData();
    }, [link]);

    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <Card 
            title={title}
            description={description}
            summary={summary}
            imageUrl={imageUrl}
            url={link}
            onClick={() => window.open(link, '_blank')}
        />
    );
};
