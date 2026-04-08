"use client";

import { useState } from "react";
import { applyVars } from "@/hooks/useCSSVars";
import { Star, Plus } from "lucide-react";
import { ReviewCard, Review } from "./ReviewCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ReviewListProps {
  reviews: Review[];
  entityName?: string;
  onAddReview?: (review: Omit<Review, "id" | "createdAt">) => void;
  showAddButton?: boolean;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    authorName: "Alice Johnson",
    authorTitle: "Sales Director",
    rating: 5,
    body: "Excellent results — found 92% valid emails. Highly recommend.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    verified: true,
  },
  {
    id: "r2",
    authorName: "Bob Chen",
    authorTitle: "Growth Lead",
    rating: 4,
    body: "Great tool overall. Fast processing and accurate. Minor UI issues but nothing major.",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    verified: true,
  },
  {
    id: "r3",
    authorName: "Carol Martin",
    authorTitle: "Marketing Manager",
    rating: 4,
    body: "Very useful for campaign outreach. Saved hours of manual work.",
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
];

export function ReviewList({
  reviews,
  entityName = "this",
  onAddReview,
  showAddButton = true,
}: ReviewListProps) {
  const allReviews = reviews.length > 0 ? reviews : MOCK_REVIEWS;
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const avgRating =
    allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  const handleSubmit = () => {
    if (!body.trim()) return;
    onAddReview?.({
      authorName: "You",
      rating,
      body,
      verified: false,
    });
    setBody("");
    setRating(5);
    setShowModal(false);
  };

  return (
    <div>
      <div className="c360-review-list-summary">
        <div className="c360-review-list-summary__score-col">
          <div className="c360-review-list-summary__avg">
            {avgRating.toFixed(1)}
          </div>
          <div className="c360-review-list-summary__stars-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={
                  i < Math.round(avgRating)
                    ? "var(--c360-warning)"
                    : "transparent"
                }
                color={
                  i < Math.round(avgRating)
                    ? "var(--c360-warning)"
                    : "var(--c360-border)"
                }
              />
            ))}
          </div>
          <div className="c360-review-list-summary__count">
            {allReviews.length} reviews
          </div>
        </div>
        <div className="c360-review-list-summary__bars">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = allReviews.filter((r) => r.rating === star).length;
            const pct = (count / allReviews.length) * 100;
            return (
              <div key={star} className="c360-review-list-histogram-row">
                <span className="c360-review-list-histogram-row__label">
                  {star}
                </span>
                <Star
                  size={10}
                  fill="var(--c360-warning)"
                  color="var(--c360-warning)"
                />
                <div className="c360-review-list-histogram-row__track">
                  <div
                    className="c360-review-list-histogram-row__fill"
                    ref={(el) =>
                      applyVars(el, { "--c360-hist-pct": `${pct}%` })
                    }
                  />
                </div>
                <span className="c360-review-list-histogram-row__count">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        {showAddButton && (
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setShowModal(true)}
          >
            Add Review
          </Button>
        )}
      </div>

      <div className="c360-review-list-stack">
        {allReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Review ${entityName}`}
      >
        <div className="c360-review-list-modal__stack">
          <div>
            <label className="c360-review-list-modal__label">Rating</label>
            <div className="c360-review-list-modal__stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="c360-review-list-modal__star-btn"
                  aria-label={`Rate ${i + 1} out of 5`}
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i + 1)}
                >
                  <Star
                    size={24}
                    fill={
                      (hoverRating || rating) > i
                        ? "var(--c360-warning)"
                        : "transparent"
                    }
                    color={
                      (hoverRating || rating) > i
                        ? "var(--c360-warning)"
                        : "var(--c360-border)"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="c360-review-list-modal__label">Your review</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={`Share your experience with ${entityName}...`}
              className="c360-review-list-modal__textarea"
            />
          </div>
          <div className="c360-review-list-modal__actions">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!body.trim()}>
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
