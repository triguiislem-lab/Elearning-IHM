import React from 'react';
import { motion } from 'framer-motion';

const TestimonialCard = ({ testimonial, index, renderStars }) => {
  return (
    <motion.div
      key={testimonial.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className="testimonial-card"
    >
      <div className="testimonial-card-body">
        {/* Quote icon */}
        <div className="testimonial-quote">"</div>
        
        {/* Testimonial content */}
        <p className="testimonial-content">
          "{testimonial.comment}"
        </p>
        
        {/* Rating stars */}
        <div className="testimonial-rating">{renderStars(testimonial.rating)}</div>
        
        {/* Avatar and identity section */}
        <div className="testimonial-footer">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="testimonial-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://ui-avatars.com/api/?name=' +
                encodeURIComponent(testimonial.name) +
                '&background=random';
            }}
          />
          <div>
            <h3 className="testimonial-author">{testimonial.name}</h3>
            <p className="testimonial-role">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
