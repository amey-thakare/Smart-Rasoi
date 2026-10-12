package com.smartrasoi.util;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Unit 4 Syllabus Topic: Custom Annotations.
 *
 * Demonstrates:
 * - @Retention policy (RUNTIME for reflection access)
 * - @Target (TYPE for class-level annotation)
 * - Annotation element attributes with default values
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface SmartRasoiEntity {
    String tableName() default "";
    String description() default "Smart Rasoi Academic Domain Entity";
    int version() default 1;
}
