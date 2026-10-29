package com.example.leads.common;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> validation(MethodArgumentNotValidException e) {
    Map<String, String> errors = new LinkedHashMap<>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(f -> errors.putIfAbsent(f.getField(), f.getDefaultMessage()));
    return ResponseEntity.badRequest()
        .body(Map.of("message", "Please correct the highlighted fields", "errors", errors));
  }

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<?> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode())
        .body(Map.of("message", Objects.requireNonNullElse(e.getReason(), "Request failed")));
  }

  @ExceptionHandler({
    MethodArgumentTypeMismatchException.class,
    HttpMessageNotReadableException.class
  })
  ResponseEntity<?> malformed(Exception e) {
    return ResponseEntity.badRequest()
        .body(Map.of("message", "Invalid request value, status, or date"));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> conflict(Exception e) {
    return ResponseEntity.status(409)
        .body(Map.of("message", "This record conflicts with existing data"));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e) {
    org.slf4j.LoggerFactory.getLogger(getClass()).error("Unexpected server error", e);
    return ResponseEntity.internalServerError()
        .body(Map.of("message", "Unexpected server error. Please try again later."));
  }
}
