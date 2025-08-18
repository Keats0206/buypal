import { useState } from 'react';

export default function ChatInput({
  status,
  onSubmit,
}: {
  status: string;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState('');

  return (
    <form
      className="flex gap-2"
      onSubmit={e => {
        e.preventDefault();
        if (text.trim() === '') return;
        onSubmit(text);
        setText('');
      }}
    >
      <textarea
        className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e6ffb7] focus:border-transparent resize-none"
        placeholder="Type your message..."
        disabled={status !== 'ready'}
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        cols={50}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (text.trim() === '') return;
            onSubmit(text);
            setText('');
          }
        }}
      />
    </form>
  );
}