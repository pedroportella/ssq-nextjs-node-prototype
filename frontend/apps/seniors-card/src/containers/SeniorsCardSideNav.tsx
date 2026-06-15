import { QhdsIcon, QhdsSideNav } from "@ssq/ui-library";

export function SeniorsCardSideNav({ activeHref }: { activeHref: string }) {
  return (
    <QhdsSideNav
      activeHref={activeHref}
      ariaLabel="Seniors Card navigation"
      heading="Home"
      headingHref="/"
      headingIcon={<QhdsIcon size="md" symbol="home" />}
      items={[
        {
          href: "/#about-service",
          icon: <QhdsIcon size="md" symbol="document" />,
          label: "About this service"
        },
        {
          href: "/#eligibility",
          icon: <QhdsIcon size="md" symbol="document" />,
          label: "Eligibility"
        },
        {
          href: "/#before-you-start",
          icon: <QhdsIcon size="md" symbol="document" />,
          label: "Before you start"
        },
        {
          href: "/apply",
          icon: <QhdsIcon size="md" symbol="document" />,
          label: "Start application"
        },
        {
          href: "/application-status",
          icon: <QhdsIcon size="md" symbol="clock" />,
          items: [
            { href: "/application-status#request-summary", label: "Request summary" },
            { href: "/application-status#supporting-documents", label: "Supporting documents" },
            { href: "/application-status#recent-activity", label: "Recent activity" }
          ],
          label: "Application status"
        }
      ]}
    />
  );
}
