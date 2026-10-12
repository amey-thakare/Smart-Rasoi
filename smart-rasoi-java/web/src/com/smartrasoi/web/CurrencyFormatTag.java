package com.smartrasoi.web;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.SimpleTagSupport;
import java.io.IOException;

/**
 * Unit 7 Syllabus Topic: Custom JSP Tags.
 *
 * Demonstrates:
 * - Creating custom tag handler extending SimpleTagSupport
 * - Tag attribute handling (amount property)
 * - Writing formatted dynamic output directly to JspWriter
 * - Paired with /WEB-INF/tlds/rasoi-tags.tld
 */
public class CurrencyFormatTag extends SimpleTagSupport {

    private double amount;

    public void setAmount(double amount) {
        this.amount = amount;
    }

    @Override
    public void doTag() throws JspException, IOException {
        String formatted = String.format("₹%.2f", amount);
        getJspContext().getOut().write(formatted);
    }
}
