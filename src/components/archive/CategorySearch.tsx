"use client";

import { SearchIcon, ArrowRightIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";

interface CategorySearchProps {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    placeholder?: string;
    onSearch?: (query: string) => void;
}

export default function CategorySearch({
    categories,
    activeCategory,
    onCategoryChange,
    placeholder = "Explore the knowledge graph...",
    onSearch,
}: CategorySearchProps) {
    const [query, setQuery] = useState("");

    // Visual only: Listen to Ctrl+K to focus input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                document.getElementById("category-search-input")?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) onSearch(query);
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 my-12">
            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="relative w-full max-w-3xl mb-8">
                <InputGroup className="w-full h-14 rounded-xl bg-muted/50 dark:bg-slate-900/50 border border-black/10 dark:border-white/10 backdrop-blur-xl flex items-center shadow-sm transition-all focus-within:ring-1 focus-within:ring-cyan-500/50">
                    <InputGroupAddon align="inline-start" className="ml-4">
                        <SearchIcon className="text-muted-foreground w-5 h-5" />
                    </InputGroupAddon>

                    <InputGroupInput
                        id="category-search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder}
                        className="h-full border-none focus:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground text-sm flex-1 ml-2"
                    />

                    {/* Right side adornments */}
                    <div className="flex items-center gap-2 mr-2">
                        <div className="hidden sm:flex items-center justify-center px-2 py-1 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-xs text-muted-foreground font-mono">
                            <span className="text-[10px] mr-1">Ctrl</span> K
                        </div>
                        <button
                            type="submit"
                            className="w-8 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center transition-colors"
                        >
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </InputGroup>
            </form>

            {/* Filter Categories Horizontal Scroll */}
            <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex items-center gap-3 w-max">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => onCategoryChange(cat)}
                                className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap border ${isActive
                                        ? "bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                                    }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
