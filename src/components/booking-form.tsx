"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BookingForm() {
  const [notice, setNotice] = useState("");

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setNotice("This form is not connected. Nothing was sent.");
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="booking-name">Name</Label>
        <Input id="booking-name" name="name" autoComplete="name" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="booking-email">Email</Label>
        <Input id="booking-email" name="email" type="email" autoComplete="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="booking-message">What you have in mind</Label>
        <Textarea id="booking-message" name="message" rows={5} />
      </div>
      <Button type="submit">This form does not send</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {notice ||
          "Nothing is delivered from this page. Add BOOKING_URL or CONTACT_EMAIL when you want a real way to get in touch."}
      </p>
    </form>
  );
}
