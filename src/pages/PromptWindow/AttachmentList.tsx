import React from 'react';
import { X, Trash, Link } from 'lucide-react';
import styles from './PromptWindow.module.scss';

interface AttachmentListProps {
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}
const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, setAttachments }) => {
  const handleDelete = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles['attachments']}>
      {attachments.map((attachment, index) => (
        <React.Fragment key={index}>
          {attachment.type === 'image' && (
            <div className={styles['attachment']}>
              <div className={styles['image-attachment']}>
                <img src={attachment.content} alt="Uploaded content" style={{ maxWidth: '200px' }} />
                <Trash className={styles['delete-btn']} onClick={() => handleDelete(index)} />
              </div>
            </div>
          )}
          {attachment.type === 'code' && (
            <div className={styles['attachment']}>
              <div className={styles['code-attachment']}>
                <pre className={styles['code-snippet']}>{attachment.content}</pre>
                <X className={styles['delete-btn']} onClick={() => handleDelete(index)} />
              </div>
            </div>
          )}
          {attachment.type === 'quote' && (
            <div className={styles['attachment']}>
              <div className={styles['quote-attachment']}>
                <blockquote>{attachment.content}</blockquote>
                <X className={styles['delete-btn']} onClick={() => handleDelete(index)} />
              </div>
            </div>
          )}
          {attachment.type === 'url' && (
            <div className={styles['attachment']}>
                <div className={styles['url-attachment']}>
                <Link size={16} />
                <div>{attachment.content}</div>
                <X className={styles['delete-btn']} onClick={() => handleDelete(index)} />
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default AttachmentList;