"use client"

import { useState } from "react"
import { Star, Loader2, MessageSquareOff, Pencil, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { StarRatingInput } from "@/components/courses/star-rating-input"
import { useAuthStore } from "@/store/auth-store"
import { useCourseReviews, useCreateReview, useUpdateReview, useDeleteReview } from "@/hooks/use-reviews"
import { formatDate, initials } from "@/lib/format"
import type { Review } from "@/types"

export function CourseReviews({
  courseId,
  initialReviews,
}: {
  courseId: string
  initialReviews: Review[]
}) {
  const user = useAuthStore((s) => s.user)
  const { data: reviews } = useCourseReviews(courseId)
  const createReview = useCreateReview(courseId)
  const updateReview = useUpdateReview(courseId)
  const deleteReview = useDeleteReview(courseId)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  const list = reviews ?? initialReviews
  const ownReview = list.find(
    (review) => (typeof review.student === "object" ? review.student._id : review.student) === user?._id
  )
  const isPending = createReview.isPending || updateReview.isPending

  function startEdit(review: Review) {
    setEditingId(review._id)
    setRating(review.rating)
    setComment(review.comment)
  }

  function cancelEdit() {
    setEditingId(null)
    setRating(5)
    setComment("")
  }

  function handleSubmit() {
    if (!comment.trim()) return
    if (editingId) {
      updateReview.mutate(
        { id: editingId, rating, comment },
        { onSuccess: () => cancelEdit() }
      )
    } else {
      createReview.mutate(
        { rating, comment },
        { onSuccess: () => setComment("") }
      )
    }
  }

  return (
    <div className="space-y-6">
      {user?.role === "student" && (!ownReview || editingId) && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-2">
            <p className="text-sm font-medium">
              {editingId ? "Sharhni tahrirlash" : "Sharh qoldiring"}
            </p>
            <StarRatingInput value={rating} onChange={setRating} />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Kurs haqida fikringizni yozing..."
              className="min-h-20"
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isPending || !comment.trim()}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {editingId ? "Saqlash" : "Yuborish"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={cancelEdit}>
                  Bekor qilish
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <MessageSquareOff className="size-6" />
          <p className="text-sm">Hozircha sharhlar yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((review) => {
            const student = typeof review.student === "object" ? review.student : null
            const isOwn = review._id === ownReview?._id
            return (
              <div key={review._id} className="flex gap-3">
                <Avatar>
                  <AvatarFallback>{initials(student?.name ?? "?")}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{student?.name ?? "Foydalanuvchi"}</p>
                    <div className="flex items-center gap-2">
                      {review.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      )}
                      {isOwn && (
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Sharhni tahrirlash"
                            onClick={() => startEdit(review)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={<Button variant="ghost" size="icon-sm" aria-label="Sharhni o'chirish" />}
                            >
                              <Trash2 className="size-3.5" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sharhni o&apos;chirasizmi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu amalni bekor qilib bo&apos;lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteReview.mutate(review._id)}>
                                  O&apos;chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < review.rating
                            ? "size-3.5 fill-gold text-gold"
                            : "size-3.5 text-muted-foreground/40"
                        }
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
