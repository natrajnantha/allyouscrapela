function notecreate(event) {
  event.preventDefault();
  var id = $(this).attr("value");
  var obj = {
    title: $("#note-title")
      .val()
      .trim(),
    body: $("#note-body")
      .val()
      .trim()
  };
  $.post("/note/" + id, obj, function(data) {
    window.location.href = "/";
  });
}

function shownote(event) {
  event.preventDefault();
  var id = $(this).attr("value");
  $("#notecreate")
    .fadeIn(400)
    .css("display", "flex");
  $("#add-note").attr("value", id);
  $.get("/" + id, function(data) {
    $("#article-title").text(data.title);
    $.get("/note/" + id, function(data) {
      if (data) {
        $("#note-title").val(data.title);
        $("#note-body").val(data.body);
      }
    });
  });
}

function changestatus() {
  var status = $(this).attr("value");
  if (status === "Saved") {
    $(this).html("Remove");
  }
}

function changeback() {
  $(this).html($(this).attr("value"));
}

$(document).on("click", ".notecreate-button", shownote);
$(document).on("click", "#add-note", notecreate);
$(".status").hover(changestatus, changeback);
$("#close-note").on("click", function() {
  $("#notecreate").fadeOut(300);
});
