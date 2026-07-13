package com.example.usermanagement.controller;

import com.example.usermanagement.model.Task;
import com.example.usermanagement.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;
    public TaskController(TaskService taskService) { this.taskService = taskService; }

    @GetMapping public ResponseEntity<?> getAll() { List<Task> tasks = taskService.getAllTasks(); return ResponseEntity.ok(Map.of("success", true, "tasks", tasks, "total", tasks.size())); }
    @GetMapping("/{id}") public ResponseEntity<?> getById(@PathVariable Long id) { return taskService.getTaskById(id).map(t -> ResponseEntity.ok(Map.of("success", true, "task", t))).orElse(ResponseEntity.notFound().build()); }
    @GetMapping("/open") public ResponseEntity<?> getOpen() { return ResponseEntity.ok(Map.of("success", true, "tasks", taskService.getOpenTasks())); }
    @GetMapping("/vehicle/{immat}") public ResponseEntity<?> getByVehicle(@PathVariable String immat) { return ResponseEntity.ok(Map.of("success", true, "tasks", taskService.getTasksByVehicle(immat))); }

    @PostMapping public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Task task = taskService.createTask(
            (String) body.get("description"), body.get("anomalieId") != null ? Long.valueOf(body.get("anomalieId").toString()) : null,
            body.get("vehicleId") != null ? Long.valueOf(body.get("vehicleId").toString()) : null, (String) body.get("vehiculeImmatriculation"),
            body.get("chauffeurId") != null ? Long.valueOf(body.get("chauffeurId").toString()) : null, (String) body.get("chauffeurNom"),
            (String) body.get("assignedTo"), (String) body.get("priority"), (String) body.get("category"), (String) body.get("createdBy"));
        return ResponseEntity.ok(Map.of("success", true, "task", task));
    }

    @PutMapping("/{id}/done") public ResponseEntity<?> markAsDone(@PathVariable Long id, @RequestBody Map<String, String> body) { return ResponseEntity.ok(Map.of("success", true, "task", taskService.markAsDone(id, body.get("resolutionNotes")))); }
    @PutMapping("/{id}/close") public ResponseEntity<?> close(@PathVariable Long id) { return ResponseEntity.ok(Map.of("success", true, "task", taskService.closeTask(id))); }
}