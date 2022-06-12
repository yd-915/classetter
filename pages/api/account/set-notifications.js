/* eslint-disable consistent-return */
import {
  getSupabaseService,
  getUserProfile,
  getUserByAccessToken,
} from "../../../utils/supabase";

export const notificationTypes = [
  {
    value: "email_subscription_created",
    title: "New Client",
    description: "Be notified when you get a new client",
  },
  {
    value: "email_subscription_ended",
    title: "",
    description: "Be notified when a client's subscription ends",
  },
];

export default async function handler(req, res) {
  const sendError = (error) =>
    res.status(200).json({
      status: {
        type: "failed",
        title: "Failed to Update Notifications",
        ...error,
      },
    });

  const supabase = getSupabaseService();
  const { user } = await getUserByAccessToken(supabase, req);
  if (!user) {
    return sendError({ message: "You are not signed in" });
  }

  const profile = await getUserProfile(user, supabase);
  if (!profile) {
    return sendError({ message: "profile not found" });
  }

  const notifications = notificationTypes
    .filter((notificationType) => req.body[notificationType.value] === "on")
    .map(({ value }) => value);
  await supabase.from("profile").update({ notifications }).eq("id", profile.id);

  res.status(200).json({
    status: {
      type: "succeeded",
      title: "Successfully Updated Notifications",
    },
  });
}
