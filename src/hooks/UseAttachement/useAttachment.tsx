import styles from './attachments.module.scss';

export const useAttachment = () => {
    const renderAttachment = (attachment: string, index: number) => {
        try {
            const parsedAttachment = JSON.parse(attachment);
            if (
                typeof parsedAttachment === 'string' &&
                parsedAttachment.startsWith('attachments/') &&
                (parsedAttachment.endsWith('.png') ||
                    parsedAttachment.endsWith('.jpg') ||
                    parsedAttachment.endsWith('.jpeg'))
            ) {
                return (
                    <img
                        key={index}
                        src={`safe-file://${parsedAttachment}`}
                        alt="Attachment"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            console.error('Failed to load image:', parsedAttachment);
                        }}
                        className={styles['note-attachment-image']}
                    />
                );
            } else {
                return <blockquote key={index}>{parsedAttachment}</blockquote>;
            }
        } catch (error) {
            console.error('Failed to parse attachment:', error);
            return <blockquote key={index}>{attachment}</blockquote>;
        }
    };


    const attachmentsComponent = (attachments: string[]) => {
        return (attachments.length > 0 ? <div className={styles.container}>{attachments?.map((attachment, index) => renderAttachment(attachment, index))}</div> : null);
    };

    return { attachmentsComponent };
};

 
