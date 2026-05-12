import { HashtagResultsSection } from "../sections/hashtag-results-section";

interface HashtagViewProps {
  tag: string;
};

export const HashtagView = ({
  tag,
}: HashtagViewProps) => {
  return (
    <div className="max-w-[1300px] mx-auto mb-10 flex flex-col gap-y-6 px-4 pt-8">
      <div className="flex flex-col gap-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          #{tag}
        </h1>
        <p className="text-sm text-muted-foreground">
          Video liên quan đến hashtag #{tag}
        </p>
      </div>

      <HashtagResultsSection tag={tag} />
    </div>
  );
};
