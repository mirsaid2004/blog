import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { SearchIcon } from "lucide-react"
import { QueryBadgeButton } from "./QueryBadgeButton"

const FILTER_CATEGORIES = [
    { label: "All", value: "all" },
    { label: "Frontend", value: "frontend" },
    { label: "Backend", value: "backend" },
    { label: "DevOps", value: "devops" },
    { label: "AI", value: "ai" },
    { label: "Systems", value: "systems" },
    { label: "Systems", value: "systems" },
    { label: "Systems", value: "systems" },
    { label: "Systems", value: "systems" },
    { label: "Systems", value: "systems" },
    { label: "Systems", value: "systems" },
    { label: "Systems", value: "systems" },
]

function HeroFilterings() {
    return <>
        <InputGroup className="max-w-2xl mx-auto mb-7 h-14 rounded-full  ">
            <InputGroupInput className="h-full ml-2 " id="inline-start-input" placeholder="Search for articles, architectures, or tools..." />
            <InputGroupAddon align="inline-start" className="ml-3">
                <SearchIcon className="text-muted-foreground size-5" />
            </InputGroupAddon>
        </InputGroup>
        <div className="max-w-2xl mx-auto mb-16 animate-renderFromBottom">
            <div className="flex flex-wrap justify-center gap-3">
                {FILTER_CATEGORIES.map((category) => (
                    <QueryBadgeButton
                        key={category.value}
                        value={category.value}
                        label={category.label}
                    />
                ))}
            </div>
        </div>
    </>
}

export default HeroFilterings;