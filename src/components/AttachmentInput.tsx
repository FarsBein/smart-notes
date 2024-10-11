import React, { DragEvent } from 'react';
import { X, Trash, Paperclip, Code, Image, Quote, Link } from 'lucide-react';
import '../styles/global.scss';

interface AttachmentInputProps {
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}

const AttachmentInput: React.FC<AttachmentInputProps> = ({ attachments, setAttachments }) => {
  const handleDelete = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="attachments">
      {attachments.map((attachment, index) => (
        <div key={index} className="attachment">
          {attachment.type === 'image' && (
            <div className="image-attachment">
              <img src={attachment.content} alt="Uploaded content" style={{ maxWidth: '200px' }} />
              <Trash className="delete-btn" onClick={() => handleDelete(index)} />
            </div>
          )}
          {attachment.type === 'code' && (
            <div className="code-attachment">
              <pre className="code-snippet">{attachment.content}</pre>
              <X className="delete-btn" onClick={() => handleDelete(index)} />
            </div>
          )}
          {attachment.type === 'quote' && (
            <div className="quote-attachment">
              <blockquote>{attachment.content}</blockquote>
              <X className="delete-btn" onClick={() => handleDelete(index)} />
            </div>
          )}
          {attachment.type === 'url' && (
            <div className="url-attachment">
              <Link size={16} />
              <div>{attachment.content}</div>
              <X className="delete-btn" onClick={() => handleDelete(index)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AttachmentInput;