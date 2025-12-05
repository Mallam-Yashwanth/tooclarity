"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HomeHeader from "@/components/student/home/HomeHeader";
import FooterNav from "@/components/student/home/FooterNav";
import { useAuth } from "@/lib/auth-context";
import RaiseTicketDialog, { TicketFormData } from "@/components/student/help/RaiseTicketDialog";
import styles from "./HelpCentre.module.css";
import Image from "next/image";

interface FAQ {
  question: string;
  answer: string;
}

const HelpCentrePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRaiseTicketOpen, setIsRaiseTicketOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // TODO: Fetch these from API
  const ticketsRaised = 3;
  const myRequests = 7;

  // Mock tickets list (replace with API data later)
  const tickets = [
    { id: "TC-1023", category: "Technical Issue", date: "2025-11-05", status: "Open" },
    { id: "TC-1019", category: "Billing & Payment", date: "2025-11-03", status: "In Progress" },
    { id: "TC-1007", category: "Account & Profile", date: "2025-10-28", status: "Resolved" },
    { id: "TC-0998", category: "Course Information", date: "2025-10-20", status: "Open" },
  ];

  const faqs: FAQ[] = [
    {
      question: "How do I sign up?",
      answer: "Click \"Get Started\" on the homepage and register using your email or Google account.",
    },
    {
      question: "Is TooClarity free?",
      answer: "Yes, creating an account and exploring colleges is completely free.",
    },
    {
      question: "Does TooClarity offer free counselling?",
      answer: "Yes! We provide a free first counselling session to help students understand their options.",
    },
    {
      question: "How can I book my free counselling session?",
      answer: "Go to the Counselling section in your dashboard and click \"Book Free Session.\"",
    },
    {
      question: "What happens after my free counselling session?",
      answer: "You'll receive personalized college recommendations and can opt for advanced counselling packages if you wish.",
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleNotificationClick = () => {
    router.push("/student/notifications");
  };

  const handleWishlistClick = () => {
    router.push("/dashboard");
  };

  const handleProfileClick = () => {
    router.push("/student/profile");
  };

  const handleExploreClick = () => {
    router.push("/student/explore");
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleTicketSubmit = async (data: TicketFormData) => {
    try {
      // TODO: Add API call to submit ticket
      console.log("Ticket submitted:", data);
      // You can add toast notification here
    } catch (error) {
      console.error("Error submitting ticket:", error);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <HomeHeader
        userName={user?.name || "Student"}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        onFilterClick={() => {}}
        onNotificationClick={handleNotificationClick}
        onWishlistClick={handleWishlistClick}
        onProfileClick={handleProfileClick}
        showSearchAndFilter={false}
      />

      <div className={styles.content}>
        <h1 className={styles.title}>Help Centre</h1>

        {/* Action Cards */}
        <div className={styles.actionCards}>
          <button
            className={styles.raiseTicketCard}
            onClick={() => setIsRaiseTicketOpen(true)}
          >
            <div className={styles.cardIcon}>
              <Image src="/images/ticket.svg" alt="Raise Ticket" width={24} height={24} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Raise a Ticket</span>
              {/* <span className={styles.cardCount}>{ticketsRaised}</span> */}
            </div>
          </button>

          {/* <div className={styles.myRequestsCard}>
            <div className={styles.cardIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3ZM19 19H5V5H19V19ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z"
                  fill="white"
                />
              </svg>
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>My Requests</span>
              <span className={styles.cardCount}>{myRequests}</span>
            </div>
          </div> */}
        </div>

        {/* Tickets Raised Section */}
        {/* <div className={styles.ticketsSection}>
          <h2 className={styles.ticketsTitle}>Tickets raised</h2>
          <div className={styles.ticketsList}>
            {tickets.map((t) => {
              const statusClass =
                t.status === "Open"
                  ? styles.statusOpen
                  : t.status === "In Progress"
                  ? styles.statusInProgress
                  : styles.statusResolved;
              return (
                <div key={t.id} className={styles.ticketItem}>
                  <div className={styles.ticketMeta}>
                    <span className={styles.ticketId}>#{t.id}</span>
                    <span className={styles.ticketCategory}>{t.category}</span>
                  </div>
                  <div className={styles.ticketRight}>
                    <span className={styles.ticketDate}>{t.date}</span>
                    <span className={`${styles.statusBadge} ${statusClass}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}

        {/* FAQs Section */}
        <div className={styles.faqSection}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>

          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`${styles.faqItem} ${
                  expandedFAQ === index ? styles.faqItemExpanded : ""
                }`}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggleFAQ(index)}
                >
                  <span className={styles.questionText}>{faq.question}</span>
                  <svg
                    className={`${styles.chevron} ${
                      expandedFAQ === index ? styles.chevronExpanded : ""
                    }`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="#697282"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {expandedFAQ === index && (
                  <div className={styles.faqAnswer}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <FooterNav onExploreClick={handleExploreClick} />

      <RaiseTicketDialog
        open={isRaiseTicketOpen}
        onOpenChange={setIsRaiseTicketOpen}
        onSubmit={handleTicketSubmit}
      />
    </div>
  );
};

export default HelpCentrePage;
