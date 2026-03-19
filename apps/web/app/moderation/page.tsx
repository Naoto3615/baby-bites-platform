'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createReport,
  getAuthMe,
  getModerationDashboard,
  getModerationReports,
  updateReport,
} from '../lib/client-api';
import { getStoredAccessToken } from '../lib/auth-client';
import {
  ModerationActionType,
  ReportItem,
  ReportStatus,
  ReportTargetType,
  UserRole,
} from '../lib/types';

const reportTargets: ReportTargetType[] = [
  'RECIPE',
  'COMMUNITY_POST',
  'COMMUNITY_COMMENT',
  'USER',
];

const reportStatuses: ReportStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

const moderationActions: ModerationActionType[] = [
  'HIDE_CONTENT',
  'UNHIDE_CONTENT',
  'WARN_USER',
  'SUSPEND_USER',
  'RESTORE_USER',
  'DELETE_CONTENT',
];

export default function ModerationPage() {
  const [token] = useState<string | null>(() => getStoredAccessToken());
  const [role, setRole] = useState<UserRole | null>(null);
  const [message, setMessage] = useState('');

  const [targetType, setTargetType] = useState<ReportTargetType>('COMMUNITY_POST');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('危険な内容の可能性');
  const [detail, setDetail] = useState('運営確認をお願いします。');

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [dashboard, setDashboard] = useState<{ open: number; underReview: number; resolved: number; rejected: number } | null>(null);

  const [statusMap, setStatusMap] = useState<Record<string, ReportStatus>>({});
  const [actionMap, setActionMap] = useState<Record<string, ModerationActionType | ''>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const canModerate = role === 'MODERATOR' || role === 'ADMIN';

  const loadModerationData = async (accessToken: string) => {
    const [reportResult, dashboardResult] = await Promise.all([
      getModerationReports(accessToken),
      getModerationDashboard(accessToken),
    ]);

    setReports(reportResult.items);
    setDashboard(dashboardResult.reports);

    const nextStatusMap: Record<string, ReportStatus> = {};
    const nextActionMap: Record<string, ModerationActionType | ''> = {};
    const nextNoteMap: Record<string, string> = {};

    for (const report of reportResult.items) {
      nextStatusMap[report.id] = report.status;
      nextActionMap[report.id] = '';
      nextNoteMap[report.id] = '';
    }

    setStatusMap(nextStatusMap);
    setActionMap(nextActionMap);
    setNoteMap(nextNoteMap);
  };

  useEffect(() => {
    const accessToken = token;
    if (!accessToken) {
      return;
    }

    void getAuthMe(accessToken)
      .then((me) => {
        setRole(me.role);
        if (me.role === 'MODERATOR' || me.role === 'ADMIN') {
          return loadModerationData(accessToken);
        }
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'ログイン情報の取得に失敗しました');
      });
  }, [token]);

  const handleCreateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setMessage('先にAccountページでログインしてください');
      return;
    }

    try {
      const result = await createReport(token, {
        targetType,
        targetId,
        reason,
        detail,
      });
      setMessage(`通報を作成しました: ${result.id}`);
      setTargetId('');
      if (canModerate) {
        await loadModerationData(token);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '通報作成に失敗しました');
    }
  };

  const handleModerate = async (reportId: string) => {
    if (!token) {
      setMessage('先にログインしてください');
      return;
    }

    try {
      await updateReport(token, reportId, {
        status: statusMap[reportId],
        actionType: actionMap[reportId] || undefined,
        resolutionNote: noteMap[reportId] || undefined,
        actionNote: noteMap[reportId] || undefined,
      });
      setMessage(`通報を更新しました: ${reportId}`);
      await loadModerationData(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '通報更新に失敗しました');
    }
  };

  return (
    <main className="pb-16 pt-8 md:pt-12">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="text-xs tracking-[0.16em] text-cyan-300">MODERATION</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">通報とモデレーション</h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          一般ユーザーは通報、モデレーター以上は対応更新とダッシュボード確認が可能です。
        </p>
        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
      </section>

      <section className="mt-5">
        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">通報を作成</h2>
          <form className="mt-3 grid gap-2 md:grid-cols-2" onSubmit={handleCreateReport}>
            <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={targetType} onChange={(e) => setTargetType(e.target.value as ReportTargetType)}>
              {reportTargets.map((target) => (
                <option key={target} value={target}>{target}</option>
              ))}
            </select>
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="targetId" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm md:col-span-2" placeholder="理由" value={reason} onChange={(e) => setReason(e.target.value)} />
            <textarea className="min-h-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm md:col-span-2" placeholder="詳細" value={detail} onChange={(e) => setDetail(e.target.value)} />
            <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 md:col-span-2" type="submit" disabled={!token}>通報する</button>
          </form>
        </article>
      </section>

      <section className="mt-5 grid gap-3">
        <article className="surface rounded-2xl p-4">
          <h2 className="text-lg font-semibold">モデレーションダッシュボード</h2>
          {canModerate && dashboard ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <p className="rounded-lg border border-slate-700 p-3">OPEN: {dashboard.open}</p>
              <p className="rounded-lg border border-slate-700 p-3">UNDER_REVIEW: {dashboard.underReview}</p>
              <p className="rounded-lg border border-slate-700 p-3">RESOLVED: {dashboard.resolved}</p>
              <p className="rounded-lg border border-slate-700 p-3">REJECTED: {dashboard.rejected}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-300">モデレーター/管理者でログインすると表示されます。</p>
          )}
        </article>

        {canModerate
          ? reports.map((report) => (
              <article key={report.id} className="surface rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{report.targetType}</span>
                  <span>•</span>
                  <span>{report.targetId}</span>
                  <span>•</span>
                  <span>{new Date(report.createdAt).toLocaleString('ja-JP')}</span>
                </div>
                <h3 className="mt-2 text-base font-semibold">{report.reason}</h3>
                {report.detail ? <p className="mt-1 text-sm text-slate-300">{report.detail}</p> : null}
                <p className="mt-1 text-xs text-slate-400">報告者: {report.reporter.displayName}</p>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    value={statusMap[report.id] ?? report.status}
                    onChange={(e) =>
                      setStatusMap((prev) => ({
                        ...prev,
                        [report.id]: e.target.value as ReportStatus,
                      }))
                    }
                  >
                    {reportStatuses.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>

                  <select
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    value={actionMap[report.id] ?? ''}
                    onChange={(e) =>
                      setActionMap((prev) => ({
                        ...prev,
                        [report.id]: e.target.value as ModerationActionType | '',
                      }))
                    }
                  >
                    <option value="">(actionなし)</option>
                    {moderationActions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>

                  <input
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    placeholder="対応メモ"
                    value={noteMap[report.id] ?? ''}
                    onChange={(e) =>
                      setNoteMap((prev) => ({
                        ...prev,
                        [report.id]: e.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900"
                  type="button"
                  onClick={() => void handleModerate(report.id)}
                >
                  更新
                </button>
              </article>
            ))
          : null}
      </section>
    </main>
  );
}
