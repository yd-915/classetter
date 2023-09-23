import Head from "next/head";

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Use - AstraTuition</title>
      </Head>
      <div className="prose mx-auto max-w-prose text-lg">
        <h1>
          <span className="mt-2 block text-center text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
            Terms of Use
          </span>
        </h1>
      </div>
      <div className="prose prose-lg prose-blue mx-auto mt-6 text-gray-500">
        <h3>Your Account</h3>
        <p>By signing in you agree to the following:</p>
        <ul>
          <li>
            We can delete your account at any time, deleting all user data, as
            well as cancelling/refunding any coaching subscriptions.
          </li>
          <li>
            Subscriptions are nonrefundable. It sucks if you subscribed to a bad
            coach, but all you can do is cancel your subscription.
          </li>
        </ul>
      </div>
    </>
  );
}
