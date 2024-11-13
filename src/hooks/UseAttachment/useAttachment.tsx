import { ImageViewer } from '@/components/ImageViewer/ImageViewer';
import styles from './attachments.module.scss';
import { LinkPreview } from '@/components/LinkPreview/LinkPreview';

export const useAttachment = () => {

    const isImage = (attachment: string) => {
        return (attachment.startsWith('attachments/') &&
            (attachment.endsWith('.png') || attachment.endsWith('.jpg') || attachment.endsWith('.jpeg'))
        );
    };

    const isLink = (attachment: string) => {
        return (
            typeof attachment === 'string' &&
            attachment.startsWith('http')
        );
    };

    const renderAttachment = (attachment: string, index: number) => {
        try {
            const parsedAttachment = JSON.parse(attachment);
            if (isImage(parsedAttachment)) {
                return (
                    <ImageViewer
                        key={index}
                        src={`safe-file://${parsedAttachment}`}
                        alt="Attachment"
                    />
                );
            } else if (isLink(parsedAttachment)) {
                return <LinkPreview key={index} link={parsedAttachment} />;
            } else if (parsedAttachment.length > 0) {
                return <blockquote key={index}>{parsedAttachment}</blockquote>;
            }
        } catch (error) {
            console.error('Failed to parse attachment:', error);
            return <blockquote key={index}>{attachment}</blockquote>;
        }
    };


    const attachmentsComponent = (attachments: string[]) => {
        return (attachments.length > 0 ? <div className={styles.container}>
            {attachments?.map((attachment, index) => renderAttachment(attachment, index))}
        </div> : null);
    };

    return { attachmentsComponent };
};


