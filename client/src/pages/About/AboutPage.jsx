import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="about-page-container">
      <div className="about-hero-section">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="about-title"
        >
          Operational clarity <br />
          <span>at scale.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="about-subtitle"
        >
          TaskSphere was built to solve a critical business challenge: how to coordinate high-speed development teams while maintaining absolute boundary privacy and complete audit compliance.
        </motion.p>
      </div>

      {/* Main Philosophy / Narrative */}
      <section className="about-content-section">
        <div className="about-grid">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="about-text-col"
          >
            <h3>Our Philosophy</h3>
            <p>
              We believe that task management tools shouldn't overwhelm teams with unnecessary features. A product should do three things exceptionally well: segment workspaces securely, log activity immutably, and present metrics clearly.
            </p>
            <p>
              TaskSphere separates operational database models (MongoDB for flexible and quick document schemas) from reporting histories (MySQL for complex relational integrity). This hybrid design ensures fast day-to-day work item handling alongside strict audit reporting.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="about-values-col"
          >
            <div className="value-card">
              <h4>Strict Scoping Boundaries</h4>
              <p>
                Information separation is key to focus. Managers only see what is relevant to their own teams, keeping developers focused and managers protected from cross-workspace leaks.
              </p>
            </div>
            <div className="value-card">
              <h4>Compliance by Design</h4>
              <p>
                Every drag-and-drop card transition is written directly to a relational ledger, ensuring you have complete activity logs when compiling reports or exporting compliance spreadsheets.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final Quote Banner */}
      <section className="about-quote-banner">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="quote-card"
        >
          <blockquote>
            "Simplicity is the ultimate sophistication. When teams have absolute clarity over their scope, velocity follows."
          </blockquote>
        </motion.div>
      </section>
    </div>
  );
}
