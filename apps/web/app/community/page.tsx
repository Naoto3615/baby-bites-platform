import { getCommunityPosts, getTopics } from '../lib/api';

export default async function CommunityPage() {
  const [topics, posts] = await Promise.all([getTopics(), getCommunityPosts()]);

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="eyebrow">PARENT COMMUNITY</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold md:text-4xl">相談ひろば</h1>
        <p className="muted mt-3 text-sm md:text-base">
          同じ時期のママ・パパと、離乳食の進め方や悩みを気軽に共有できる場所です。
        </p>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {topics.map((topic) => (
          <article key={topic.id} className="surface rounded-2xl p-4">
            <h2 className="text-base font-semibold">{topic.name}</h2>
            <p className="muted mt-2 text-sm">{topic.description}</p>
            <p className="mt-3 text-xs text-slate-400">投稿数: {topic._count?.posts ?? 0}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-3">
        {posts.map((post) => (
          <article key={post.id} className="surface rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{post.topic.name}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
              {post.stage ? (
                <>
                  <span>•</span>
                  <span>{post.stage}</span>
                </>
              ) : null}
            </div>
            <h2 className="mt-2 text-lg font-semibold">{post.title}</h2>
            <p className="muted mt-2 text-sm">{post.body}</p>
            <p className="mt-3 text-xs text-slate-400">
              投稿者: {post.author.displayName} / コメント: {post._count?.comments ?? 0}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
