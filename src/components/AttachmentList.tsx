import React from 'react';
import { X, Trash, Link } from 'lucide-react';
import '../styles/global.scss';

interface AttachmentListProps {
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}
const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, setAttachments }) => {
  const handleDelete = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="attachments">
      {attachments.map((attachment, index) => (
        <>
          {attachment.type === 'image' && (
            <div key={index} className="attachment">
              <div className="image-attachment">
                <img src={attachment.content} alt="Uploaded content" style={{ maxWidth: '200px' }} />
                <Trash className="delete-btn" onClick={() => handleDelete(index)} />
              </div>
            </div>
          )}
          {attachment.type === 'code' && (
            <div key={index} className="attachment">
              <div className="code-attachment">
                <pre className="code-snippet">{attachment.content}</pre>
                <X className="delete-btn" onClick={() => handleDelete(index)} />
              </div>
            </div>
          )}
          {attachment.type === 'quote' && (
            <div key={index} className="attachment">
              <div className="quote-attachment">
                <blockquote>{attachment.content}</blockquote>
                <X className="delete-btn" onClick={() => handleDelete(index)} />
              </div>
            </div>
          )}
          {attachment.type === 'url' && (
            <div key={index} className="attachment">
              <div className="url-attachment">
                <Link size={16} />
                <div>{attachment.content}</div>
                <X className="delete-btn" onClick={() => handleDelete(index)} />
              </div>
            </div>
          )}
        </>
      ))}
    </div>
  );
};

export default AttachmentList;