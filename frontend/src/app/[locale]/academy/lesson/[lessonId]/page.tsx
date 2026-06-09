import LessonClient from "./LessonClient";

export function generateStaticParams() {
    return [
        { lessonId: 'opening-principles' },
        { lessonId: 'endgame-basics' },
        { lessonId: 'tactics-101' }
    ];
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
    const { lessonId } = await params;
    return <LessonClient lessonId={lessonId} />;
}
