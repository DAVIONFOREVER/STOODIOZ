import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Review, ReviewTarget, Artist, Engineer, Producer, Stoodio, Label, AppReview } from '../types';
import { AppView } from '../types';
import { ChevronLeftIcon, StarIcon } from './icons';
import appIcon from '../assets/stoodioz-app-icon.png';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { getProfileImageUrl, getDisplayName } from '../constants';
import * as apiService from '../services/apiService';

type MapUser = Artist | Engineer | Producer | Stoodio | Label;

const ReviewPage: React.FC = () => {
  const { reviewTarget, currentUser, artists, engineers, producers, stoodioz, labels } = useAppState();
  const dispatch = useAppDispatch();
  const { goBack, navigate } = useNavigation();
  const [target, setTarget] = useState<ReviewTarget | null>(reviewTarget);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appReviews, setAppReviews] = useState<AppReview[]>([]);
  const [businessReviews, setBusinessReviews] = useState<AppReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const allUsers = useMemo(
    () => [...artists, ...engineers, ...producers, ...stoodioz, ...labels],
    [artists, engineers, producers, stoodioz, labels]
  );

  useEffect(() => {
    if (reviewTarget) {
      setTarget(reviewTarget);
      return;
    }
    try {
      const raw = localStorage.getItem('review_target');
      if (raw) {
        const parsed = JSON.parse(raw) as ReviewTarget;
        if (parsed?.id && parsed?.role) {
          setTarget(parsed);
          dispatch({ type: ActionTypes.SET_REVIEW_TARGET, payload: { target: parsed } });
        }
      }
    } catch {
      // ignore
    }
  }, [reviewTarget, dispatch]);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      if (target?.id) {
        const data = await apiService.fetchReviewsForTarget(target.role, target.id);
        setReviews(Array.isArray(data) ? data : []);
      } else {
        const appData = await apiService.fetchAppReviews('app');
        setAppReviews(Array.isArray(appData) ? appData : []);
        if (currentUser) {
          const bizData = await apiService.fetchAppReviews('business');
          setBusinessReviews(Array.isArray(bizData) ? bizData : []);
        } else {
          setBusinessReviews([]);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
      setReviews([]);
      setAppReviews([]);
      setBusinessReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [target?.id, target?.role, currentUser]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!rating || rating < 1) return;
    setIsSubmitting(true);
    try {
      const reviewerName = getDisplayName(currentUser as MapUser);
      if (target?.id) {
        const result = await apiService.createReview({
          targetRole: target.role,
          targetId: target.id,
          reviewerId: currentUser.id,
          reviewerName,
          rating,
          comment: comment.trim() || null,
        });
        if (result?.rating_overall !== undefined) {
          const updatedUsers = allUsers.map((u) =>
            u.id === target.id ? ({ ...(u as any), rating_overall: result.rating_overall } as any) : u
          );
          dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as any } });
        }
      } else {
        await apiService.createAppReview({
          reviewerId: currentUser.id,
          reviewerName,
          reviewerAvatarUrl: (currentUser as any)?.image_url || null,
          rating,
          comment: comment.trim() || null,
          category: 'app',
        });
      }
      setComment('');
      setRating(5);
      await loadReviews();
    } catch (err: any) {
      console.error('Failed to submit review', err);
      alert(err?.message || 'Review could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetLabel = target?.name || 'Stoodioz App';
  const targetImage = target?.image_url || null;
  const headerImage = targetImage || (!target ? appIcon : null);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <button onClick={goBack} className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-all font-black uppercase tracking-[0.25em] text-[10px]">
        <ChevronLeftIcon className="w-4 h-4" /> System Back
      </button>

      <div className="cardSurface p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800">
          {headerImage ? (
            <img src={headerImage} alt={targetLabel} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
              {targetLabel.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{target ? 'Reviews for' : 'App Reviews'}</p>
          <h1 className="text-2xl font-black text-zinc-100">{targetLabel}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="cardSurface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-100">Reviews</h2>
              {isLoading && <span className="text-xs text-zinc-500">Loading...</span>}
            </div>
            {target ? (
              reviews.length === 0 && !isLoading ? (
                <p className="text-zinc-400">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const reviewer = allUsers.find((u) => u.id === review.reviewer_id);
                    const reviewerName = reviewer ? getDisplayName(reviewer as MapUser) : review.reviewer_name;
                    const reviewerImage = reviewer ? getProfileImageUrl(reviewer as MapUser) : null;
                    return (
                      <div key={review.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                              {reviewerImage ? (
                                <img src={reviewerImage} alt={reviewerName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
                                  {reviewerName?.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-200">{reviewerName}</p>
                              <p className="text-xs text-zinc-500">{new Date(review.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <StarIcon className="w-4 h-4" />
                            <span className="text-sm font-bold">{Number(review.rating).toFixed(1)}</span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-3 text-sm text-zinc-300">"{review.comment}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : appReviews.length === 0 && !isLoading ? (
              <p className="text-zinc-400">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {appReviews.map((review) => {
                  const reviewerName = review.reviewer_name;
                  const reviewerImage = review.reviewer_avatar_url || null;
                  return (
                    <div key={review.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                            {reviewerImage ? (
                              <img src={reviewerImage} alt={reviewerName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
                                {reviewerName?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-200">{reviewerName}</p>
                            <p className="text-xs text-zinc-500">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <StarIcon className="w-4 h-4" />
                          <span className="text-sm font-bold">{Number(review.rating).toFixed(1)}</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm text-zinc-300">"{review.comment}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {!target && currentUser && (
            <div className="cardSurface p-6">
              <h2 className="text-lg font-bold text-zinc-100 mb-3">Business Reviews (Members Only)</h2>
              {businessReviews.length === 0 && !isLoading ? (
                <p className="text-zinc-400">No business reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {businessReviews.map((review) => (
                    <div key={review.id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                            {review.reviewer_avatar_url ? (
                              <img src={review.reviewer_avatar_url} alt={review.reviewer_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
                                {review.reviewer_name?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-200">{review.reviewer_name}</p>
                            <p className="text-xs text-zinc-500">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <StarIcon className="w-4 h-4" />
                          <span className="text-sm font-bold">{Number(review.rating).toFixed(1)}</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm text-zinc-300">"{review.comment}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="cardSurface p-6 space-y-4">
            {!currentUser ? (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-zinc-100">Log in to leave a review</h2>
                <p className="text-sm text-zinc-400">You can read reviews without an account.</p>
                <button
                  type="button"
                  onClick={() => navigate(AppView.LOGIN)}
                  className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Log in
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-zinc-100">Leave a review</h2>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 rounded-full ${star <= rating ? 'text-yellow-400' : 'text-zinc-600'}`}
                      title={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <StarIcon className="w-6 h-6" />
                    </button>
                  ))}
                  <span className="text-xs text-zinc-400 ml-2">{rating}/5</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg bg-zinc-800/70 border border-zinc-700 text-zinc-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                  placeholder="Share your experience (optional)"
                />
                {!target && (
                  <p className="text-xs text-zinc-500">
                    This review is for the Stoodioz app experience. Business reviews are visible to members only.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating < 1}
                  className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
