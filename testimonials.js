
/* ==========================================
   TESTIMONIALS - PUBLIC DISPLAY AND SUBMISSION
   Website: www.sharanchandran.com
   ========================================== */

(() => {
  const config = window.TESTIMONIAL_CONFIG || {};

  const form = document.getElementById("testimonial-form");
  const status = document.getElementById("form-status");
  const list = document.getElementById("approved-testimonials");

  // Create the Supabase client when the library and configuration are available.
  const supabaseClient =
    window.supabase &&
    config.SUPABASE_URL &&
    config.SUPABASE_ANON_KEY &&
    window.supabase.createClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY
    );

  function showStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#b42318" : "#237447";
  }

  // Display only testimonials approved in the database.
  async function loadApprovedTestimonials() {
    if (!list) return;

    if (!supabaseClient) {
      list.textContent =
        "Testimonials will appear here once the backend is configured.";
      return;
    }

    const { data, error } = await supabaseClient
      .from("testimonials")
      .select("id, name, details, message, approved_at")
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(50);

    list.replaceChildren();

    if (error) {
      list.textContent = "Testimonials are temporarily unavailable.";
      console.error("Could not load testimonials:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      const empty = document.createElement("div");
      empty.className = "testimonial-empty";

      const quote = document.createElement("span");
      quote.className = "empty-quote";
      quote.textContent = "“";

      const message = document.createElement("p");
      message.textContent =
        "Published testimonials will appear here once they have been approved.";

      empty.append(quote, message);
      list.appendChild(empty);
      return;
    }

    for (const item of data) {
      const article = document.createElement("article");
      article.className = "testimonial-item";

      const quote = document.createElement("div");
      quote.className = "testimonial-quote-mark";
      quote.textContent = "“";

      const message = document.createElement("p");
      message.className = "testimonial-message";
      message.textContent = item.message;

      const author = document.createElement("p");
      author.className = "testimonial-author";
      author.textContent = item.name || "Anonymous";

      article.append(quote, message, author);

      if (item.details) {
        const details = document.createElement("p");
        details.className = "testimonial-details";
        details.textContent = item.details;
        article.appendChild(details);
      }

      list.appendChild(article);
    }
  }

  // Submit testimonials through the server-side Edge Function.
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supabaseClient) {
      showStatus(
        "The submission service is not configured yet. Please try again later.",
        true
      );
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    showStatus("Submitting your testimonial…");

    const payload = {
      name: document.getElementById("name")?.value.trim() || "",
      details: document.getElementById("details")?.value.trim() || "",
      message: document.getElementById("message")?.value.trim() || "",
      website: document.getElementById("website")?.value || ""
    };

    try {
      const response = await fetch(
        `${config.SUPABASE_URL}/functions/v1/submit-testimonial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.SUPABASE_ANON_KEY
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Submission failed. Please try again."
        );
      }

      form.reset();
      showStatus(
        "Thank you! Your testimonial has been submitted and is awaiting approval."
      );
    } catch (error) {
      showStatus(
        error.message || "Unable to submit right now. Please try again.",
        true
      );
    } finally {
      if (button) button.disabled = false;
    }
  });

  loadApprovedTestimonials();
})();

