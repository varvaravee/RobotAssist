import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import * as nipplejs from 'nipplejs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  isForward: boolean = true;

  ngOnInit() {
    // Initialize joystick when component is ready
    this.initJoystick();
  }

  ngAfterViewInit() {
    // Start the camera feed after the view is initialized
    this.startCameraFeed();
  }

  startCameraFeed() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        this.videoElement.nativeElement.srcObject = stream;
      })
      .catch((error) => console.error('Error accessing webcam:', error));
  }

  toggleDirection() {
    this.isForward = !this.isForward;
  }

  initJoystick() {
    const leftJoystickElement = document.getElementById('joystick-left');
  const rightJoystickElement = document.getElementById('joystick-right');

  if (leftJoystickElement) {
    const leftJoystick = nipplejs.create({
      zone: leftJoystickElement,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'blue',
      size: 100,
      lockY: true, // Left joystick moves only up/down
    });

    leftJoystick.on('move', (event, data) => {
      console.log('Left Joystick moved:', data.direction?.angle);
    });

    leftJoystick.on('end', () => {
      console.log('Left Joystick released');
    });
  }

  if (rightJoystickElement) {
    const rightJoystick = nipplejs.create({
      zone: rightJoystickElement,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'red',
      size: 100,
      lockX: true, // Right joystick moves only left/right
    });

    rightJoystick.on('move', (event, data) => {
      console.log('Right Joystick moved:', data.direction?.angle);
    });

    rightJoystick.on('end', () => {
      console.log('Right Joystick released');
    });
  }
}
}
