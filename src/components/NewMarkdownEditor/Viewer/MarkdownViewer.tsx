import React, { useMemo } from 'react';
import { parseMarkdown } from '../utils/markdownInput';
import styles from '../Shared.module.scss';

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