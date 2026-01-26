import LessonClient from "./LessonClient";

export function generateStaticParams() {
    return [
        { lessonId: 'opening-principles' },
        { lessonId: 'endgame-basics' },
        { lessonId: 'tactics-101' }
    ];
}

export default function LessonPage() {
    return <LessonClient />;
}
