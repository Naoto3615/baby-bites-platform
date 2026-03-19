import { getCommunityPosts, getTopics } from '../lib/api';

export default async function CommunityPage() {
  const [topics, posts] = await Promise.all([getTopics(), getCommunityPosts()]);

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="text-xs tracking-[0.16em] text-cyan-300">COMMUNITY</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">子育てコミュニティ</h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">月齢・悩みテーマ別に、保護者同士で相談と情報交換ができる設計です。</p>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {topics.map((topic) => (
          <article key={topic.id} className="surface rounded-2xl p-4">
            <h2 className="text-base font-semibold">{topic.name}</h2>
            <p className="mt-2 text-sm text-slate-300">{topic.description}</p>
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
            <p className="mt-2 text-sm text-slate-300">{post.body}</p>
            <p className="mt-3 text-xs text-slate-400">
              投稿者: {post.author.displayName} / コメント: {post._count?.comments ?? 0}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
