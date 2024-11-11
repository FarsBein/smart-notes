import React, { useMemo } from 'react';
import { parseMarkdown } from '../../PopupEditor/utils/markdownInput';
import styles from './MarkdownViewer.module.scss';

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const htmlContent = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div
      className={styles.prose}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownViewer;