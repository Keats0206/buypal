import ReactMarkdown from 'react-markdown';

interface TextMessageProps {
  text: string;
}

export default function TextMessage({ text }: TextMessageProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
