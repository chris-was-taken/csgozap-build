// Get the modal
var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {

    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}


var b;
$(".header").click(function () {
var a=document.getElementById('content').style.display;
// document.getElementById('').addClass('ok')


b=document.getElementById('changeimg')
if(a=='none')
{
  document.getElementById("changeimg").classList.remove('fa-angle-down');

  document.getElementById("changeimg").classList.add('fa-angle-up');

document.getElementById('content').style.display='block'
}
else {
  {
    document.getElementById("changeimg").classList.remove('fa-angle-up');

    document.getElementById("changeimg").classList.add('fa-angle-down');
    document.getElementById('content').style.display='none'

  }
}

});



function closemobile()
{
  document.getElementById('show-mobile').style.display='none'

}

function openmobile()
{
  document.getElementById('show-mobile').style.display='block'

}

function closedesktop()
{
  document.getElementById('show-desktop').style.display='none'

}

function opendesktop()
{

  document.getElementById('show-desktop').style.display='block'

}
