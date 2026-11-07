import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { UsersService } from "./users.service";

@Controller("legal")
export class LegalController {
  @Get("privacy-policy")
  privacyPolicy(@Res() response: Response) {
    const supportEmail = process.env.PLAYMATE_SUPPORT_EMAIL;
    const escapedEmail = supportEmail?.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
    const support = supportEmail
      ? `<a href="mailto:${escapedEmail}">${escapedEmail}</a>`
      : "The Playmate operator must publish a support email before release.";
    response.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Playmate privacy policy"><title>Playmate Privacy Policy</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#17202a}h1,h2{line-height:1.25}a{color:#1457b8}</style></head><body><main>
<h1>Playmate Privacy Policy</h1><p>Effective date: November 7, 2026</p>
<p>Playmate helps people discover sports venues, book courts, join games, and manage player profiles. This policy describes data used by the Playmate mobile app and its API.</p>
<h2>Information we use</h2><ul>
<li>Account information such as email, name, phone number when provided, and sign-in identifiers. Authentication credentials are handled by Supabase Auth; Playmate does not store your plaintext password.</li>
<li>Profile information you choose to provide, including photo URL, bio, sports, skill levels, preferred times, and broad home area.</li>
<li>Venue searches and device location when you choose the nearby-location feature. Location permission is optional; you can search by moving the map without granting it.</li>
<li>Bookings, games, join requests, group membership and messages, reviews, reports, and support requests needed to operate the features you use.</li>
<li>Payment status and payment-provider references needed to reconcile a purchase. Razorpay processes payment credentials; Playmate does not store full card numbers or bank credentials.</li>
<li>Technical and security data needed to authenticate requests, prevent abuse, and keep the service reliable.</li></ul>
<h2>How information is used and shared</h2><p>We use information to provide account access, venue discovery, bookings, payments, games, community safety, customer support, and service security. Booking details needed to fulfill a reservation are shared with the selected venue. Payment details are processed by Razorpay. Supabase provides authentication, database, and file-storage services; Resend may deliver service emails. These providers process information to provide their services.</p>
<p>Profile visibility controls apply to player-facing profile fields. Your email and phone number are not shown on public profiles. You can opt out of location permission in device settings.</p>
<h2>Retention and deletion</h2><p>You can request account deletion in the app or at <a href="/account-deletion">Delete your Playmate account</a>. We delete authentication access and remove or anonymize direct profile details. We may retain limited booking, payment, safety-report, or transaction records when required for accounting, fraud prevention, dispute handling, or legal obligations; retained records are restricted and kept only as needed.</p>
<h2>Security and children</h2><p>We use authenticated access controls and service providers to protect information. No online service can guarantee absolute security. Playmate is not designed specifically for children. If local law requires parental consent for a user, that consent must be obtained before the user provides personal data.</p>
<h2>Contact</h2><p>For privacy questions or deletion support, contact ${support}.</p>
</main></body></html>`);
  }

  @Get("community-guidelines")
  communityGuidelines(@Res() response: Response) {
    response.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Playmate community guidelines"><title>Playmate Community Guidelines</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#17202a}h1,h2{line-height:1.25}</style></head><body><main>
<h1>Playmate Community Guidelines</h1><p>Version ${UsersService.COMMUNITY_TERMS_VERSION}</p>
<p>Playmate is for finding people to play sports with. Be respectful, honest, and safe in games, profiles, reviews, groups, and messages.</p>
<h2>Not allowed</h2><ul><li>Harassment, bullying, hate speech, threats, sexual exploitation, or graphic violence.</li><li>Illegal activity, dangerous instructions, scams, spam, impersonation, or misleading venue and game listings.</li><li>Sharing someone else’s private information or using another person’s account or content without permission.</li><li>Discriminatory behavior or attempts to evade a block, moderation action, or safety restriction.</li></ul>
<h2>Safety and moderation</h2><p>Use the in-app report and block controls when content or a player makes you feel unsafe. Reports are reviewed by Playmate moderators. We may remove content, restrict features, suspend accounts, or refer urgent safety matters to the appropriate authorities. Do not use Playmate to arrange activity that violates local law.</p>
<p>Only post content you have the right to share. Keep contact and location details private unless you choose to share them directly. Game times, venue details, and costs must be accurate.</p>
<h2>Age and guardian responsibility</h2><p>Users must meet the minimum age required by the laws that apply to them. Where local law requires parent or guardian consent, obtain it before using Playmate or sharing personal information.</p>
<h2>Enforcement and appeals</h2><p>If we take moderation action, you can contact Playmate support using the contact details in the app’s Privacy Policy. We may preserve information needed to investigate safety reports and comply with legal obligations.</p>
<p>By accepting these guidelines in the app, you agree to follow them whenever you post or message on Playmate.</p>
</main></body></html>`);
  }
}
