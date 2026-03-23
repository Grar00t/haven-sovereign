import { useEffect, useState } from 'react';

export function useTypewriter(
  strings: string[],
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2000,
  enabled = true
) {
  const [text, setText] = useState('');
  const [stringIndex, setStringIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!enabled || strings.length === 0) return;

    const current = strings[stringIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), typingSpeed);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), deletingSpeed);
      } else {
        setIsDeleting(false);
        setStringIndex((prev) => (prev + 1) % strings.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, stringIndex, strings, typingSpeed, deletingSpeed, pauseDuration, enabled]);

  return { text, isTyping: !isDeleting && text.length < strings[stringIndex]?.length };
}
