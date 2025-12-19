import React, { useState } from 'react';
import { Send, Loader } from 'lucide-react';
import './DeepDiveInput.css';

interface DeepDiveInputProps {
    hypothesisId: string;
    onSubmit: (instruction: string) => Promise<void>;
    placeholder?: string;
}

export function DeepDiveInput({ onSubmit, placeholder }: DeepDiveInputProps) {
    const [instruction, setInstruction] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!instruction.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await onSubmit(instruction);
            setInstruction(''); // 清空输入框
        } catch (error) {
            console.error('深挖洞察失败', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="deep-dive-input" onSubmit={handleSubmit}>
            <input
                type="text"
                className="deep-dive-input__field"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={placeholder || '输入指令，如"用 age 和 salary 做散点图"'}
                disabled={isLoading}
            />
            <button
                type="submit"
                className="deep-dive-input__btn"
                disabled={!instruction.trim() || isLoading}
            >
                {isLoading ? <Loader size={20} /> : <Send size={20} />}
            </button>
        </form>
    );
}
