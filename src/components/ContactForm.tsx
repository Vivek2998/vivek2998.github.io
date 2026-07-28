import { useEffect, useRef, useState } from 'react'
import { contactForm, links } from '../content'

type Status = 'idle' | 'sending' | 'error'

const FIELD =
  'w-full rounded-lg border border-hairline bg-surface-raised/70 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-signal focus:outline-none'

export function ContactForm({ onSent }: { onSent: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const firstFieldRef = useRef<HTMLInputElement>(null)

  // Opening the panel should put the cursor where typing starts.
  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    // Honeypot: real people leave this hidden field empty.
    if (data.get('company')) {
      onSent()
      return
    }

    const name = String(data.get('name') ?? '')
    const email = String(data.get('email') ?? '')
    const message = String(data.get('message') ?? '')

    // No endpoint configured — hand off to the visitor's mail client so the
    // form is never a dead end.
    if (!contactForm.endpoint) {
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`)
      const subject = encodeURIComponent(`Portfolio message from ${name}`)
      window.location.href = `mailto:${links.email}?subject=${subject}&body=${body}`
      onSent()
      return
    }

    setStatus('sending')
    setError('')

    try {
      const response = await fetch(contactForm.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          // Formspree reads _subject for the notification it sends on.
          _subject: `Portfolio message from ${name}`,
        }),
      })

      if (!response.ok) {
        // Formspree reports problems as { errors: [{ message }] }; fall back to
        // the status code when the body isn't what we expect.
        const body = await response.json().catch(() => null)
        const detail = Array.isArray(body?.errors)
          ? body.errors.map((e: { message?: string }) => e.message).filter(Boolean).join('. ')
          : ''
        throw new Error(detail || `The form service returned ${response.status}`)
      }

      onSent()
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof Error
          ? `${err.message}.`
          : 'Something went wrong sending that.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="sr-only">Your name</span>
          <input
            ref={firstFieldRef}
            name="name"
            required
            autoComplete="name"
            placeholder="Your name"
            className={FIELD}
          />
        </label>

        <label className="block">
          <span className="sr-only">Your email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Your email"
            className={FIELD}
          />
        </label>
      </div>

      <label className="flex min-h-0 flex-1 flex-col">
        <span className="sr-only">Your message</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="What are you working on?"
          className={`${FIELD} min-h-32 flex-1 resize-none`}
        />
      </label>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute h-0 w-0 opacity-0"
      />

      {status === 'error' && (
        <p role="alert" className="text-xs leading-relaxed text-[var(--color-hue-rose)]">
          {error} You can email me directly at{' '}
          <a href={`mailto:${links.email}`} className="underline">
            {links.email}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-medium text-surface-raised transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
