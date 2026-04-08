"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { getAvatarUrl, formatRelativeTime } from "@/lib/utils";

export interface Review {
  id: string;
  authorName: string;
  authorTitle?: string;
  authorAvatar?: string;
  rating: number;
  body: string;
  createdAt: string;
  verified?: boolean;
}

interface ReviewCardProps {
  review: Review;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="c360-review-card__star-row">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < rating ? "var(--c360-warning)" : "transparent"}
          color={i < rating ? "var(--c360-warning)" : "var(--c360-border)"}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="c360-review-card">
      <Image
        src={review.authorAvatar ?? getAvatarUrl(review.authorName, 40)}
        alt={review.authorName}
        width={40}
        height={40}
        unoptimized={Boolean(review.authorAvatar)}
        className="c360-review-card__avatar"
      />

      <div className="c360-review-card__body">
        <div className="c360-review-card__header-row">
          <div>
            <div className="c360-review-card__name">
              {review.authorName}
              {review.verified && (
                <span className="c360-review-card__verified">✓ Verified</span>
              )}
            </div>
            {review.authorTitle && (
              <div className="c360-review-card__title">
                {review.authorTitle}
              </div>
            )}
          </div>
          <div className="c360-review-card__meta">
            <StarRating rating={review.rating} />
            <span className="c360-review-card__time">
              {formatRelativeTime(review.createdAt)}
            </span>
          </div>
        </div>
        <p className="c360-review-card__text">{review.body}</p>
      </div>
    </div>
  );
}
